/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown line ending or markdown space.
 *
 * @param {Code} code
 * @returns {boolean}
 */
export function markdownLineEndingOrSpace(code) {
  return code < codes.nul || code === codes.space
}
