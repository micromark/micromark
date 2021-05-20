/**
 * @typedef {import('../micromark/index.js').Effects} Effects
 * @typedef {import('../micromark/index.js').State} State
 */

import {
  markdownLineEnding,
  markdownSpace
} from '../micromark-core-character/index.js'
import {types} from '../micromark-core-symbol/types.js'
import {factorySpace} from '../micromark-factory-space/index.js'

/**
 * @param {Effects} effects
 * @param {State} ok
 */
export function factoryWhitespace(effects, ok) {
  /** @type {boolean} */
  let seen

  return start

  /** @type {State} */
  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      seen = true
      return start
    }

    if (markdownSpace(code)) {
      return factorySpace(
        effects,
        start,
        seen ? types.linePrefix : types.lineSuffix
      )(code)
    }

    return ok(code)
  }
}
