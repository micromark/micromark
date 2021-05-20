/**
 * @typedef {import('../micromark/index.js').Construct} Construct
 * @typedef {import('../micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../micromark/index.js').State} State
 */

import assert from 'assert'
import {codes} from '../micromark-core-symbol/codes.js'
import {markdownLineEnding} from '../micromark-core-character/index.js'
import {types} from '../micromark-core-symbol/types.js'

/** @type {Construct} */
export const hardBreakEscape = {
  name: 'hardBreakEscape',
  tokenize: tokenizeHardBreakEscape
}

/** @type {Tokenizer} */
function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter(types.hardBreakEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    return open
  }

  /** @type {State} */
  function open(code) {
    if (markdownLineEnding(code)) {
      effects.exit(types.escapeMarker)
      effects.exit(types.hardBreakEscape)
      return ok(code)
    }

    return nok(code)
  }
}
