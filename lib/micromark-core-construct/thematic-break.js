/**
 * @typedef {import('../micromark/index.js').Construct} Construct
 * @typedef {import('../micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../micromark/index.js').State} State
 * @typedef {import('../micromark/index.js').Code} Code
 */

import assert from 'assert'
import {codes} from '../micromark-core-symbol/codes.js'
import {
  markdownLineEnding,
  markdownSpace
} from '../micromark-core-character/index.js'
import {constants} from '../micromark-core-symbol/constants.js'
import {types} from '../micromark-core-symbol/types.js'
import {factorySpace} from '../micromark-factory-space/index.js'

/** @type {Construct} */
export const thematicBreak = {
  name: 'thematicBreak',
  tokenize: tokenizeThematicBreak
}

/** @type {Tokenizer} */
function tokenizeThematicBreak(effects, ok, nok) {
  let size = 0
  /** @type {NonNullable<Code>} */
  let marker

  return start

  /** @type {State} */
  function start(code) {
    assert(
      code === codes.asterisk ||
        code === codes.dash ||
        code === codes.underscore,
      'expected `*`, `-`, or `_`'
    )

    effects.enter(types.thematicBreak)
    marker = code
    return atBreak(code)
  }

  /** @type {State} */
  function atBreak(code) {
    if (code === marker) {
      effects.enter(types.thematicBreakSequence)
      return sequence(code)
    }

    if (markdownSpace(code)) {
      return factorySpace(effects, atBreak, types.whitespace)(code)
    }

    if (
      size < constants.thematicBreakMarkerCountMin ||
      (code !== codes.eof && !markdownLineEnding(code))
    ) {
      return nok(code)
    }

    effects.exit(types.thematicBreak)
    return ok(code)
  }

  /** @type {State} */
  function sequence(code) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)
    return atBreak(code)
  }
}
