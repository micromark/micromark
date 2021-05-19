/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown line ending (see
 * `markdownLineEnding`) or markdown space (see `markdownSpace`).
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownLineEndingOrSpace(code) {
  return code !== null && (code < codes.nul || code === codes.space)
}
