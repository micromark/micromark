/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown line ending.
 *
 * A **markdown line ending** is the virtual characters M-0003 CARRIAGE RETURN
 * LINE FEED (CRLF), M-0004 LINE FEED (LF) and M-0005 LINE FEED (CR).
 *
 * In micromark, the actual character U+000A LINE FEED (LF) and U+000D CARRIAGE
 * RETURN (CR) are replaced by these virtual characters depending on whether
 * they occurred together.
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownLineEnding(code) {
  return code !== null && code < codes.horizontalTab
}
