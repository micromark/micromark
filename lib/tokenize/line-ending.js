/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

/** @type {Construct} */
export const lineEnding = {name: 'lineEnding', tokenize: tokenizeLineEnding}

/** @type {Tokenize} */
function tokenizeLineEnding(effects, ok) {
  return start

  /** @type {State} */
  function start(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return factorySpace(effects, ok, types.linePrefix)
  }
}
