import {regexCheck} from '../util/regex-check.js'

/**
 * Check whether the character code represents an ASCII digit (`0` though `9`).
 *
 * An **ASCII digit** is a character in the inclusive range U+0030 (`0`) to
 * U+0039 (`9`).
 */
export const asciiDigit = regexCheck(/\d/)
