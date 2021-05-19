/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from '../character/codes.js'
import {markdownLineEndingOrSpace} from '../character/markdown-line-ending-or-space.js'
import {unicodePunctuation} from '../character/unicode-punctuation.js'
import {unicodeWhitespace} from '../character/unicode-whitespace.js'
import {constants} from '../constant/constants.js'

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
