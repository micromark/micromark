/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an ASCII control character.
 *
 * Note: EOF is seen as ASCII control here, because `null < 32 == true`.
 *
 * @param {Code} code
 * @returns {boolean}
 */
export function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code < codes.space || code === codes.del
  )
}
