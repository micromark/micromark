/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown line ending.
 *
 * @param {Code} code
 * @returns {boolean}
 */
export function markdownLineEnding(code) {
  return code < codes.horizontalTab
}
