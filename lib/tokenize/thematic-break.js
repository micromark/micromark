/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Code} Code
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownSpace} from '../character/markdown-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

/** @type {Construct} */
export const thematicBreak = {
  name: 'thematicBreak',
  tokenize: tokenizeThematicBreak
}

/** @type {Tokenize} */
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
