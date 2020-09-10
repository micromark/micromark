exports.tokenize = tokenizeBlockQuoteStart
exports.continuation = {tokenize: tokenizeBlockQuoteContinuation}
exports.exit = exit

import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

function tokenizeBlockQuoteStart(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.greaterThan) {
      return nok(code)
    }

    if (!self.containerState.started) {
      effects.enter(types.blockQuote)
      self.containerState.started = true
    }

    effects.enter(types.blockQuotePrefix)
    effects.enter(types.blockQuoteMarker)
    effects.consume(code)
    effects.exit(types.blockQuoteMarker)
    return after
  }

  function after(code: any) {
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

function tokenizeBlockQuoteContinuation(effects: any, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

function exit(effects: any) {
  effects.exit(types.blockQuote)
}
