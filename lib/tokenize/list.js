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
  var self = this
  var initialSize
  var size

  return start

  function start(code) {
    initialSize = prefixSize(self.events)

    if (
      code === self.containerState.marker ||
      (!self.containerState.marker &&
        (code === codes.asterisk ||
          code === codes.plusSign ||
          code === codes.dash))
    ) {
      return effects.check(thematicBreak, nok, unordered)(code)
    }

    if (
      asciiDigit(code) &&
      (!self.containerState.marker ||
        self.containerState.type === types.listOrdered)
    ) {
      return ordered(code)
    }

    return nok(code)
  }

  function unordered(code) {
    if (!self.containerState.marker) {
      self.containerState.type = types.listUnordered
      effects.enter(self.containerState.type)
    }

    effects.enter(types.listItemPrefix)
    return atMarker(code)
  }

  function ordered(code) {
    if (
      !self.containerState.marker &&
      self.interrupt &&
      code !== codes.digit1
    ) {
      return nok(code)
    }

    if (!self.containerState.marker) {
      self.containerState.type = types.listOrdered
      effects.enter(self.containerState.type)
    }

    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemValue)
    effects.consume(code)
    size = 1
    return self.interrupt ? afterValue : inside
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

    if (!self.containerState.marker) self.containerState.marker = code

    if (self.containerState.marker === code) {
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
    if (self.interrupt) {
      return nok(code)
    }

    self.containerState.initialBlankLine = true
    initialSize++
    return endOfPrefix(code)
  }

  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      effects.consume(code)
      effects.exit(types.listItemPrefixWhitespace)
      return endOfPrefix
    }

    return nok(code)
  }

  function endOfPrefix(code) {
    effects.exit(types.listItemPrefix)
    self.containerState.size =
      initialSize + prefixSize(self.events, types.listItemPrefix)
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
  var self = this

  this.containerState._closeFlow = undefined

  return effects.check(blank, onBlank, checkContent)

  function onBlank(code) {
    if (self.containerState.initialBlankLine) {
      self.containerState.furtherBlankLine = true
    }

    return ok(code)
  }

  function checkContent(code) {
    if (self.containerState.furtherBlankLine || !markdownSpace(code)) {
      return effects.attempt(nextItem, onItem, nok)(code)
    }

    return effects.attempt(
      indent,
      ok,
      effects.attempt(nextItem, onItem, nok)
    )(code)
  }

  function onItem(code) {
    // While we do continue, we signal that the flow should be closed.
    self.containerState._closeFlow = true
    return ok(code)
  }
}

function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type)
}

function tokenizeIndent(effects, ok, nok) {
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemIndent, self.containerState.size + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    return prefixSize(self.events, types.listItemIndent) ===
      self.containerState.size
      ? ok(code)
      : nok(code)
  }
}

function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemPrefixWhitespace, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    return markdownSpace(code) ||
      !prefixSize(self.events, types.listItemPrefixWhitespace)
      ? nok(code)
      : ok(code)
  }
}
