/**
 * @typedef {import('../micromark/index.js').Construct} Construct
 * @typedef {import('../micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../micromark/index.js').State} State
 */

import assert from 'assert'
import {asciiPunctuation} from '../micromark-core-character/index.js'
import {codes} from '../micromark-core-symbol/codes.js'
import {types} from '../micromark-core-symbol/types.js'

/** @type {Construct} */
export const characterEscape = {
  name: 'characterEscape',
  tokenize: tokenizeCharacterEscape
}

/** @type {Tokenizer} */
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
