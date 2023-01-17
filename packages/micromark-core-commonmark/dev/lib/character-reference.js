/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').Code} Code
 */

import {ok as assert} from 'uvu/assert'
import {decodeNamedCharacterReference} from 'decode-named-character-reference'
import {
  asciiAlphanumeric,
  asciiDigit,
  asciiHexDigit
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'
import {types} from 'micromark-util-symbol/types.js'

/** @type {Construct} */
export const characterReference = {
  name: 'characterReference',
  tokenize: tokenizeCharacterReference
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeCharacterReference(effects, ok, nok) {
  const self = this
  let size = 0
  /** @type {number} */
  let max
  /** @type {(code: Code) => code is number} */
  let test

  return start

  /**
   * Start of a character reference.
   *
   * ```markdown
   * > | a&amp;b
   *      ^
   * > | a&#123;b
   *      ^
   * > | a&#x9;b
   *      ^
   * ```
   *
   * @type {State} */
  function start(code) {
    assert(code === codes.ampersand, 'expected `&`')
    effects.enter(types.characterReference)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    return open
  }

  /**
   * Inside a character reference, after `&`, before `#` for numeric references
   * or an alphanumeric for named references.
   * ```markdown
   * > | a&amp;b
   *       ^
   * > | a&#123;b
   *       ^
   * > | a&#x9;b
   *       ^
   * ```
   *
   * @type {State} */
  function open(code) {
    if (code === codes.numberSign) {
      effects.enter(types.characterReferenceMarkerNumeric)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerNumeric)
      return numeric
    }

    effects.enter(types.characterReferenceValue)
    max = constants.characterReferenceNamedSizeMax
    test = asciiAlphanumeric
    return value(code)
  }

  /**
   * Inside a numeric character reference, right before `x` for hexadecimals,
   * or a digit for decimals.
   * ```markdown
   * > | a&#123;b
   *        ^
   * > | a&#x9;b
   *        ^
   * ```
   *
   * @type {State} */
  function numeric(code) {
    if (code === codes.uppercaseX || code === codes.lowercaseX) {
      effects.enter(types.characterReferenceMarkerHexadecimal)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerHexadecimal)
      effects.enter(types.characterReferenceValue)
      max = constants.characterReferenceHexadecimalSizeMax
      test = asciiHexDigit
      return value
    }

    effects.enter(types.characterReferenceValue)
    max = constants.characterReferenceDecimalSizeMax
    test = asciiDigit
    return value(code)
  }

  /**
   * Inside a character reference value, after the markers (`&#x`, `&#`, or
   * `&`) that define its kind, but before the `;`.
   *
   * The character reference kind defines what and how many characters are
   * allowed.
   *
   * ```markdown
   * > | a&amp;b
   *       ^^^
   * > | a&#123;b
   *        ^^^
   * > | a&#x9;b
   *         ^
   * ```
   *
   * @type {State} */
  function value(code) {
    if (code === codes.semicolon && size) {
      const token = effects.exit(types.characterReferenceValue)

      if (
        test === asciiAlphanumeric &&
        !decodeNamedCharacterReference(self.sliceSerialize(token))
      ) {
        return nok(code)
      }

      effects.enter(types.characterReferenceMarker)
      effects.consume(code)
      effects.exit(types.characterReferenceMarker)
      effects.exit(types.characterReference)
      return ok
    }

    if (test(code) && size++ < max) {
      effects.consume(code)
      return value
    }

    return nok(code)
  }
}
