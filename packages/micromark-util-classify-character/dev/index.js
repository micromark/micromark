/**
 * @typedef {import('micromark').Code} Code
 */

import {
  markdownLineEndingOrSpace,
  unicodePunctuation,
  unicodeWhitespace
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'

/**
 * Classify whether a character is unicode whitespace, unicode punctuation, or
 * anything else.
 * Used for attention (emphasis, strong), whose sequences can open or close
 * based on the class of surrounding characters.
 *
 * Note that eof (`null`) is seen as whitespace.
 *
 * @param {Code} code
 * @returns {number|undefined}
 */
export function classifyCharacter(code) {
  if (
    code === codes.eof ||
    markdownLineEndingOrSpace(code) ||
    unicodeWhitespace(code)
  ) {
    return constants.characterGroupWhitespace
  }

  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation
  }
}
