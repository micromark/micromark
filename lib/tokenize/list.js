exports.tokenize = tokenizeListStart
exports.continuation = {tokenize: tokenizeListContinuation}
exports.exit = exit

var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
var asciiDigit = require('../character/ascii-digit')
var assign = require('../constant/assign')
var constants = require('../constant/constants')
var types = require('../constant/types')
var thematicBreak = require('./thematic-break')

var prefix = assign({}, exports, {tokenize: tokenizePrefix})

function exit(effects) {
  var t = effects.exit(types.listItem)
  effects.exit(t._ordered ? types.listOrdered : types.listUnordered)
}

function tokenizeListStart(effects, ok, nok) {
  var interrupt = this.interrupt
  var token
  var size

  return start

  function start(code) {
    if (
      code === codes.asterisk ||
      code === codes.plusSign ||
      code === codes.dash
    ) {
      // To do: interrupt, something else?
      return effects.check(thematicBreak, nok, unordered)(code)
      // Empty.
    }

    /* istanbul ignore if - Hooks. */
    if (!asciiDigit(code)) {
      return nok(code)
    }

    return ordered(code)
  }

  function unordered(code) {
    effects.enter(types.listUnordered)
    token = effects.enter(types.listItem)
    token._marker = code
    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemMarker)
    effects.consume(code)
    return after
  }

  function ordered(code) {
    if (code !== codes.digit1 && interrupt) {
      return nok(code)
    }

    effects.enter(types.listOrdered)
    token = effects.enter(types.listItem)
    token._ordered = true
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

    if (code === codes.rightParenthesis || code === codes.dot) {
      token._marker = code
      effects.exit(types.listItemValue)
      effects.enter(types.listItemMarker)
      effects.consume(code)
      return after
    }

    return nok(code)
  }

  function after(code) {
    effects.exit(types.listItemMarker)

    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      return effects.attempt(prefix, normalPrefix, longPrefix)(code)
    }

    return nok(code)
  }

  function normalPrefix(code) {
    effects.exit(types.listItemPrefix)
    return ok(code)
  }

  function longPrefix(code) {
    effects.consume(code)
    effects.exit(types.listItemPrefixWhitespace)
    effects.exit(types.listItemPrefix)
    return ok
  }
}

function tokenizeListContinuation(effects, ok, nok) {
  var size = 0
  console.log('cont:exit', start)

  return nok

  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      return prefix(code)
    }

    return prefixed(code)
  }

  function prefix(code) {
    if (++size < constants.tabSize && markdownSpace(code)) {
      effects.consume(code)
      return prefix
    }

    effects.exit(types.linePrefix)
    return prefixed(code)
  }

  function prefixed(code) {
    if (code !== codes.greaterThan) {
      return nok(code)
    }

    effects.enter(types.listItemPrefix)
    effects.enter(types.listItemMarker)
    effects.consume(code)
    effects.exit(types.listItemMarker)
    return after
  }

  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      effects.consume(code)
      effects.exit(types.listItemPrefixWhitespace)
      effects.exit(types.listItemPrefix)
      return ok
    }

    effects.exit(types.listItemPrefix)
    return ok(code)
  }
}

function tokenizePrefix(effects, ok, nok) {
  var size = 0

  return prefix

  function prefix(code) {
    if (markdownSpace(code)) {
      if (++size < constants.tabSize) {
        effects.consume(code)
        return prefix
      }

      return nok(code)
    }

    effects.exit(types.listItemPrefixWhitespace)
    return ok(code)
  }
}
