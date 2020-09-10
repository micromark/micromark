import type {Effects, NotOkay, Okay} from '../types'
import * as codes from '../character/codes'
import markdownSpace from '../character/markdown-space'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import createSpaceTokenizer from './partial-space'

export const tokenize = function tokenizeBlockQuoteStart(
  this: {containerState: {started: boolean}},
  effects: Effects,
  ok: Okay,
  nok: NotOkay
) {
  var self = this

  return start

  function start(code: number) {
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

  function after(code: number) {
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

function tokenizeBlockQuoteContinuation(effects: Effects, ok: Okay, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

export const continuation = {tokenize: tokenizeBlockQuoteContinuation}

export function exit(effects: Effects) {
  effects.exit(types.blockQuote)
}
