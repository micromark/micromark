/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').Exit} Exit
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownSpace} from '../character/markdown-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

/** @type {Construct} */
export const blockQuote = {
  name: 'blockQuote',
  tokenize: tokenizeBlockQuoteStart,
  continuation: {tokenize: tokenizeBlockQuoteContinuation},
  exit
}

/** @type {Tokenize} */
function tokenizeBlockQuoteStart(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    if (code === codes.greaterThan) {
      const state = self.containerState

      assert(state, 'expected `containerState` to be defined in container')

      if (!state.open) {
        effects.enter(types.blockQuote, {_container: true})
        state.open = true
      }

      effects.enter(types.blockQuotePrefix)
      effects.enter(types.blockQuoteMarker)
      effects.consume(code)
      effects.exit(types.blockQuoteMarker)
      return after
    }

    return nok(code)
  }

  /** @type {State} */
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

/** @type {Tokenize} */
function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  return factorySpace(
    effects,
    effects.attempt(blockQuote, ok, nok),
    types.linePrefix,
    this.parser.constructs.disable.null.includes('codeIndented')
      ? undefined
      : constants.tabSize
  )
}

/** @type {Exit} */
function exit(effects) {
  effects.exit(types.blockQuote)
}
