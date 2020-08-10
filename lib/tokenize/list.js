exports.tokenize = tokenizeListStart
exports.continuation = {tokenize: tokenizeListContinuation}
exports.exit = exit

var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
var asciiDigit = require('../character/ascii-digit')
var assign = require('../constant/assign')
var constants = require('../constant/constants')
var types = require('../constant/types')

var prefix = assign({}, exports, {tokenize: tokenizePrefix})

function exit(effects) {
  var t = effects.exit(types.listItem)
  effects.exit(t._ordered ? types.listOrdered : types.listUnordered)
}

function tokenizeListStart(effects, ok, nok) {
  var size = 1

  return start

  function start(code) {
    var ordered

    /* istanbul ignore else - Hooks. */
    if (
      code === codes.asterisk ||
      code === codes.plusSign ||
      code === codes.dash
    ) {
      // Empty.
    } else if (asciiDigit(code)) {
      ordered = true
    } else {
      return nok(code)
    }

    effects.enter(ordered ? types.listOrdered : types.listUnordered)
    var t = effects.enter(types.listItem)
    t._ordered = ordered
    t._marker = code
    effects.enter(types.listPrefix)
    effects.enter(ordered ? types.listValue : types.listMarker)
    effects.consume(code)
    return ordered ? inside : after
  }

  function inside(code) {
    if (++size < constants.listValueSizeMax && asciiDigit(code)) {
      effects.consume(code)
      return inside
    }

    if (code === codes.rightParenthesis || code === codes.dot) {
      effects.exit(types.listValue)
      effects.enter(types.listMarker)
      effects.consume(code)
      return after
    }

    return nok(code)
  }

  function after(code) {
    effects.exit(types.listMarker)

    if (markdownSpace(code)) {
      effects.enter(types.listPrefixWhitespace)
      return effects.attempt(prefix, normalPrefix, longPrefix)(code)
    }

    return nok(code)
  }

  function normalPrefix(code) {
    effects.exit(types.listPrefix)
    return ok(code)
  }

  function longPrefix(code) {
    effects.consume(code)
    effects.exit(types.listPrefixWhitespace)
    effects.exit(types.listPrefix)
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

    effects.enter(types.listPrefix)
    effects.enter(types.listMarker)
    effects.consume(code)
    effects.exit(types.listMarker)
    return after
  }

  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listPrefixWhitespace)
      effects.consume(code)
      effects.exit(types.listPrefixWhitespace)
      effects.exit(types.listPrefix)
      return ok
    }

    effects.exit(types.listPrefix)
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

    effects.exit(types.listPrefixWhitespace)
    return ok(code)
  }
}
