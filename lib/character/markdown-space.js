/**
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from './codes.js'

/**
 * Check whether a character code is an markdown space.
 *
 * A **markdown space** is the concrete character U+0020 SPACE (SP) and the
 * virtual characters M-0001 VIRTUAL SPACE (VS) and M-0002 HORIZONTAL TAB (HT).
 *
 * In micromark, the actual character U+0009 CHARACTER TABULATION (HT) is
 * replaced by one M-0002 HORIZONTAL TAB (HT) and between 0 and 3 M-0001 VIRTUAL
 * SPACE (VS) characters, depending on the column at which the tab occurred.
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownSpace(code) {
  return (
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
