exports.tokenize = tokenizeBlockQuoteStart
exports.continuation = {tokenize: tokenizeBlockQuoteContinuation}
exports.exit = exit

var codes = require('../character/codes')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var createSpaceTokenizer = require('./partial-space')

function tokenizeBlockQuoteStart(effects, ok, nok) {
  var self = this

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.greaterThan) {
      return nok(code)
    }

    if (!self.containerState.started) {
      effects.enter(types.blockQuote, {_container: true})
      self.containerState.started = true
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

function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

function exit(effects) {
  effects.exit(types.blockQuote)
}
