exports.tokenize = tokenizeBlockQuoteStart
exports.continuation = {tokenize: tokenizeBlockQuoteContinuation}
exports.exit = exit

var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')

function tokenizeBlockQuoteStart(effects, ok, nok) {
  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.greaterThan) {
      return nok(code)
    }

    effects.enter(types.blockQuote)
    effects.enter(types.blockQuotePrefix)
    effects.enter(types.blockQuoteMarker)
    effects.consume(code)
    effects.exit(types.blockQuoteMarker)
    return after
  }

  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.blockQuotePrefixWhitespace)
      effects.consume(code)
      effects.exit(types.blockQuotePrefixWhitespace)
      effects.exit(types.blockQuotePrefix)
      return ok
    }

    effects.exit(types.blockQuotePrefix)
    return ok(code)
  }
}

function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  var size = 0

  return start

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

    effects.enter(types.blockQuotePrefix)
    effects.enter(types.blockQuoteMarker)
    effects.consume(code)
    effects.exit(types.blockQuoteMarker)
    return after
  }

  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.blockQuotePrefixWhitespace)
      effects.consume(code)
      effects.exit(types.blockQuotePrefixWhitespace)
      effects.exit(types.blockQuotePrefix)
      return ok
    }

    effects.exit(types.blockQuotePrefix)
    return ok(code)
  }
}

function exit(effects) {
  effects.exit(types.blockQuote)
}
