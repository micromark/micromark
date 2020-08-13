exports.tokenize = tokenizeListStart
exports.continuation = {tokenize: tokenizeListContinuation}
exports.exit = tokenizeListEnd

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var asciiDigit = require('../character/ascii-digit')
var assign = require('../constant/assign')
var constants = require('../constant/constants')
var types = require('../constant/types')
var thematicBreak = require('./thematic-break')

var whitespaceSuffix = assign({}, exports, {tokenize: tokenizeSuffix})
var linePrefix = assign({}, exports, {tokenize: tokenizeOptionalPrefix})
var blank = {tokenize: tokenizeBlank}
var indent = {tokenize: tokenizeIndent}
var nextItem = {tokenize: tokenizeNextItem}

function tokenizeListStart(effects, ok, nok) {
  var state = this.containerState
  var interrupt = this.interrupt
  var tail = this.events[this.events.length - 1]
  var prefixSize =
    tail && tail[1].type === types.linePrefix
      ? tail[1].end.column - tail[1].start.column
      : 0
  var size

  state.xxxSupportsBlankLines = true

  return start

  function start(code) {
    if (
      code === codes.asterisk ||
      code === codes.plusSign ||
      code === codes.dash
    ) {
      return effects.check(thematicBreak, nok, unordered)(code)
    }

    /* istanbul ignore if - Hooks. */
    if (!asciiDigit(code)) {
      return nok(code)
    }

    return ordered(code)
  }

  function unordered(code) {
    effects.enter(types.listUnordered)
    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemMarker)
    effects.consume(code)
    state.marker = code
    return after
  }

  function ordered(code) {
    effects.enter(types.listOrdered)
    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemValue)
    effects.consume(code)
    size = 1

    if (interrupt) {
      return code === codes.digit1 ? afterValue : nok
    }

    return inside
  }

  function inside(code) {
    if (++size < constants.listItemValueSizeMax && asciiDigit(code)) {
      effects.consume(code)
      return inside
    }

    return afterValue(code)
  }

  function afterValue(code) {
    effects.exit(types.listItemValue)

    if (code === codes.rightParenthesis || code === codes.dot) {
      state.marker = code
      effects.enter(types.listItemMarker)
      effects.consume(code)
      return after
    }

    return nok(code)
  }

  function after(code) {
    effects.exit(types.listItemMarker)
    return effects.check(blank, onBlank, notBlank)(code)
  }

  function onBlank(code) {
    // Can’t be empty when interrupting.
    if (interrupt) {
      return nok(code)
    }

    // Note: the blank line after marker does not count as a potential blank
    // line between items.

    state.initialBlankLine = true
    prefixSize++

    return endOfPrefix(code)
  }

  function notBlank(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      return effects.attempt(whitespaceSuffix, endOfPrefix, longPrefix)(code)
    }

    return nok(code)
  }

  function endOfPrefix(code) {
    var prefixToken = effects.exit(types.listItemPrefix)
    state.size = prefixSize + prefixToken.end.offset - prefixToken.start.offset
    return ok(code)
  }

  function longPrefix(code) {
    effects.consume(code)
    effects.exit(types.listItemPrefixWhitespace)
    return endOfPrefix
  }
}

function tokenizeListContinuation(effects, ok, nok) {
  var state = this.containerState

  state.closeFlow = undefined

  return checkBlank

  function checkBlank(code) {
    // We check if this is a blank line, but don’t parse it.
    return effects.check(blank, onBlank, checkContent)(code)
  }

  function checkContent(code) {
    if (state.furtherBlankLine || !markdownSpace(code)) {
      return checkItem(code)
    }

    return effects.attempt(indent, onIndent, checkItem)(code)
  }

  function checkItem(code) {
    return effects.attempt(nextItem, onItem, nok)(code)
  }

  function onIndent(code) {
    return ok(code)
  }

  function onItem(code) {
    // To do: this is super funky: it’s weird to instruct to close flow like so.
    // Find a better way.
    state.closeFlow = true
    return ok(code)
  }

  function onBlank(code) {
    if (state.initialBlankLine) {
      state.furtherBlankLine = true
    }

    return ok(code)
  }
}

function tokenizeListEnd(effects) {
  var marker = this.containerState.marker

  effects.exit(
    marker === codes.asterisk ||
      marker === codes.plusSign ||
      marker === codes.dash
      ? types.listUnordered
      : types.listOrdered
  )
}

function tokenizeIndent(effects, ok, nok) {
  var state = this.containerState
  var size = 0

  return start

  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemIndent)
      return prefix(code)
    }

    return nok(code)
  }

  function prefix(code) {
    if (size < state.size && markdownSpace(code)) {
      effects.consume(code)
      size++
      return prefix
    }

    // Too small.
    if (size < state.size) {
      return nok(code)
    }

    effects.exit(types.listItemIndent)
    return ok(code)
  }
}

function tokenizeOptionalPrefix(effects, ok) {
  var size = 0

  return start

  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      return prefix(code)
    }

    return ok(code)
  }

  function prefix(code) {
    if (++size < constants.tabSize && markdownSpace(code)) {
      effects.consume(code)
      return prefix
    }

    effects.exit(types.linePrefix)
    return ok(code)
  }
}

function tokenizeSuffix(effects, ok, nok) {
  var size = 0

  return prefix

  function prefix(code) {
    if (markdownSpace(code)) {
      // Allow the full tab size, not just less than.
      if (size++ < constants.tabSize) {
        effects.consume(code)
        return prefix
      }

      return nok(code)
    }

    effects.exit(types.listItemPrefixWhitespace)
    return ok(code)
  }
}

function tokenizeNextItem(effects, ok, nok) {
  var interrupt = this.interrupt
  var state = this.containerState
  var events = this.events
  var marker = state.marker
  var prefixSize

  var size

  return start

  function start(code) {
    return effects.attempt(linePrefix, afterPrefix)(code)
  }

  function afterPrefix(code) {
    var tail = events[events.length - 1]

    prefixSize =
      tail && tail[1].type === types.linePrefix
        ? tail[1].end.column - tail[1].start.column
        : 0

    if (
      (code === codes.asterisk ||
        code === codes.plusSign ||
        code === codes.dash) &&
      (!marker || code === marker)
    ) {
      return effects.check(thematicBreak, nok, unordered)(code)
    }

    if (
      asciiDigit(code) &&
      (!marker || marker === codes.rightParenthesis || marker === codes.dot)
    ) {
      return ordered(code)
    }

    return nok(code)
  }

  function unordered(code) {
    if (!marker) {
      state.marker = code
      effects.enter(types.listUnordered)
    }

    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemMarker)
    effects.consume(code)
    return after
  }

  function ordered(code) {
    if (interrupt && !(!marker || code === codes.digit1)) {
      return nok(code)
    }

    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemValue)
    effects.consume(code)
    size = 1
    return inside
  }

  function inside(code) {
    if (++size < constants.listItemValueSizeMax && asciiDigit(code)) {
      effects.consume(code)
      return inside
    }

    if (
      (code === codes.rightParenthesis || code === codes.dot) &&
      code === marker
    ) {
      if (!marker) {
        state.marker = code
      }

      effects.exit(types.listItemValue)
      effects.enter(types.listItemMarker)
      effects.consume(code)
      return after
    }

    return nok(code)
  }

  function after(code) {
    effects.exit(types.listItemMarker)
    return effects.check(blank, onBlank, notBlank)(code)
  }

  function onBlank(code) {
    // Can’t be empty when interrupting.
    if (interrupt) {
      return nok(code)
    }

    state.initialBlankLine = true
    prefixSize++
    return endOfPrefix(code)
  }

  function notBlank(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      return effects.attempt(whitespaceSuffix, endOfPrefix, longPrefix)(code)
    }

    return nok(code)
  }

  function longPrefix(code) {
    effects.consume(code)
    effects.exit(types.listItemPrefixWhitespace)
    return endOfPrefix
  }

  function endOfPrefix(code) {
    var prefixToken = effects.exit(types.listItemPrefix)

    // Update the size.
    state.size = prefixSize + prefixToken.end.offset - prefixToken.start.offset

    return ok(code)
  }
}

// To do: emit tokens when externalizing.
function tokenizeBlank(effects, ok, nok) {
  return start

  function start(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return start
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      return ok(code)
    }

    return nok(code)
  }
}
