/**
 * @typedef {import('../types.js').Code} Code
 */

import {fromCharCode} from '../constant/from-char-code.js'

/**
 * Create a code check from a regex.
 *
 * @param {RegExp} regex
 * @returns {(code: Code) => boolean}
 */
export function regexCheck(regex) {
  return check

  /**
   * Check whether a code matches the bound regex.
   *
   * @param {Code} code
   * @returns {boolean}
   */
  function check(code) {
    return regex.test(fromCharCode(code))
  }
}
