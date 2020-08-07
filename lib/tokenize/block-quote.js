exports.tokenize = tokenizeBlockQuoteStart
// Continuation is parsed exactly the same as the start.
exports.continuation = {tokenize: tokenizeBlockQuoteContinuation}
exports.name = 'blockQuote'

var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
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
      effects.enter(types.blockQuoteSpace)
      effects.consume(code)
      effects.exit(types.blockQuoteSpace)
      effects.exit(types.blockQuotePrefix)
      return ok
    }

    effects.exit(types.blockQuotePrefix)
    return ok(code)
  }
}

function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  return start

  function start(code) {
    // istanbul ignore next - Hooks.
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
      effects.enter(types.blockQuoteSpace)
      effects.consume(code)
      effects.exit(types.blockQuoteSpace)
      effects.exit(types.blockQuotePrefix)
      return ok
    }

    effects.exit(types.blockQuotePrefix)
    return ok(code)
  }
}
