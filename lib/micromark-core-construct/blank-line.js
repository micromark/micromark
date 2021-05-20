/**
 * @typedef {import('../micromark/index.js').Construct} Construct
 * @typedef {import('../micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../micromark/index.js').State} State
 */

import {codes} from '../micromark-core-symbol/codes.js'
import {markdownLineEnding} from '../micromark-core-character/index.js'
import {types} from '../micromark-core-symbol/types.js'
import {factorySpace} from '../micromark-factory-space/index.js'

/** @type {Construct} */
export const blankLine = {tokenize: tokenizeBlankLine, partial: true}

/** @type {Tokenizer} */
function tokenizeBlankLine(effects, ok, nok) {
  return factorySpace(effects, afterWhitespace, types.linePrefix)

  /** @type {State} */
  function afterWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
