/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an ASCII control character.
 *
 * An **ASCII control** is a character in the inclusive range U+0000 NULL (NUL)
 * to U+001F (US), or U+007F (DEL).
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code !== null && (code < codes.space || code === codes.del)
  )
}
