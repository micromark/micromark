/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {asciiPunctuation} from '../character/ascii-punctuation.js'
import {codes} from '../character/codes.js'
import {types} from '../constant/types.js'

/** @type {Construct} */
export const characterEscape = {
  name: 'characterEscape',
  tokenize: tokenizeCharacterEscape
}

/** @type {Tokenize} */
function tokenizeCharacterEscape(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter(types.characterEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    effects.exit(types.escapeMarker)
    return open
  }

  /** @type {State} */
  function open(code) {
    if (asciiPunctuation(code)) {
      effects.enter(types.characterEscapeValue)
      effects.consume(code)
      effects.exit(types.characterEscapeValue)
      effects.exit(types.characterEscape)
      return ok
    }

    return nok(code)
  }
}
