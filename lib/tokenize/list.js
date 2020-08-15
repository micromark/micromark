exports.tokenize = tokenizeListStart
exports.continuation = {tokenize: tokenizeListContinuation}
exports.exit = tokenizeListEnd

var assert = require('assert')
var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
var asciiDigit = require('../character/ascii-digit')
var constants = require('../constant/constants')
var types = require('../constant/types')
var prefixSize = require('../util/prefix-size')
var thematicBreak = require('./thematic-break')
var createSpaceTokenizer = require('./partial-space')
var blank = require('./partial-blank-line')

var listItemPrefixWhitespace = {
  tokenize: tokenizeListItemPrefixWhitespace,
  partial: true
}
var indent = {tokenize: tokenizeIndent, partial: true}
var nextItem = {tokenize: tokenizeNextItem, partial: true}

function tokenizeListStart(effects, ok, nok) {
  var state = this.containerState
  var interrupt = this.interrupt
  var events = this.events
  var initialSize
  var size

  state.xxxSupportsBlankLines = true

  return start

  function start(code) {
    initialSize = prefixSize(events)

    if (
      code === state.marker ||
      (!state.marker &&
        (code === codes.asterisk ||
          code === codes.plusSign ||
          code === codes.dash))
    ) {
      return effects.check(thematicBreak, nok, unordered)(code)
    }

    if (
      asciiDigit(code) &&
      (!state.marker || state.type === types.listOrdered)
    ) {
      return ordered(code)
    }

    return nok(code)
  }

  function unordered(code) {
    if (!state.marker) {
      state.type = types.listUnordered
      effects.enter(state.type)
    }

    effects.enter(types.listItemPrefix)
    return atMarker(code)
  }

  function ordered(code) {
    if (!state.marker && interrupt && code !== codes.digit1) {
      return nok(code)
    }

    if (!state.marker) {
      state.type = types.listOrdered
      effects.enter(state.type)
    }

    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemValue)
    effects.consume(code)
    size = 1
    return interrupt ? afterValue : inside
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

    return code === codes.rightParenthesis || code === codes.dot
      ? atMarker(code)
      : nok(code)
  }

  function atMarker(code) {
    assert(
      code === codes.asterisk ||
        code === codes.plusSign ||
        code === codes.dash ||
        code === codes.rightParenthesis ||
        code === codes.dot,
      'expected list marker'
    )

    if (!state.marker) state.marker = code

    if (state.marker === code) {
      effects.enter(types.listItemMarker)
      effects.consume(code)
      effects.exit(types.listItemMarker)
      return effects.check(
        blank,
        onBlank,
        effects.attempt(listItemPrefixWhitespace, endOfPrefix, otherPrefix)
      )
    }

    return nok(code)
  }

  function onBlank(code) {
    // Can’t be empty when interrupting.
    if (interrupt) {
      return nok(code)
    }

    state.initialBlankLine = true
    initialSize++
    return endOfPrefix(code)
  }

  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return endOfPrefix
    }

    return nok(code)
  }

  function endOfPrefix(code) {
    effects.exit(types.listItemPrefix)
    state.size = initialSize + prefixSize(events, types.listItemPrefix)
    return ok(code)
  }
}

function tokenizeNextItem(effects, ok, nok) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

function tokenizeListContinuation(effects, ok, nok) {
  var state = this.containerState

  state.closeFlow = undefined

  return effects.check(blank, onBlank, checkContent)

  function onBlank(code) {
    if (state.initialBlankLine) state.furtherBlankLine = true
    return ok(code)
  }

  function checkContent(code) {
    if (state.furtherBlankLine || !markdownSpace(code)) {
      return effects.attempt(nextItem, onItem, nok)(code)
    }

    return effects.attempt(
      indent,
      ok,
      effects.attempt(nextItem, onItem, nok)
    )(code)
  }

  function onItem(code) {
    // To do: this is super funky: it’s weird to instruct to close flow like so.
    // Find a better way.
    state.closeFlow = true
    return ok(code)
  }
}

function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type)
}

function tokenizeIndent(effects, ok, nok) {
  var events = this.events
  var state = this.containerState

  return effects.attempt(
    createSpaceTokenizer(types.listItemIndent, state.size + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    return prefixSize(events, types.listItemIndent) === state.size
      ? ok(code)
      : nok(code)
  }
}

function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
  var events = this.events

  return effects.attempt(
    createSpaceTokenizer(types.listItemPrefixWhitespace, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    return markdownSpace(code) ||
      !prefixSize(events, types.listItemPrefixWhitespace)
      ? nok(code)
      : ok(code)
  }
}
