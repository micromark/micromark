/**
 * @typedef {import('../types.js').Effects} Effects
 * @typedef {import('../types.js').Okay} Okay
 * @typedef {import('../types.js').State} State
 */

import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownSpace} from '../character/markdown-space.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

/**
 * @param {Effects} effects
 * @param {Okay} ok
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
