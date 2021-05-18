/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown space.
 *
 * @param {Code} code
 * @returns {boolean}
 */
export function markdownSpace(code) {
  return (
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
