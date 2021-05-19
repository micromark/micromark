import {regexCheck} from '../util/regex-check.js'

/**
 * Check whether the character code represents an ASCII alphanumeric (`a`
 * though `z`, case insensitive, or `0` through `9`).
 *
 * An **ASCII alphanumeric** is an ASCII digit (see `asciiDigit`) or ASCII alpha
 * (see `asciiAlpha`).
 */
export const asciiAlphanumeric = regexCheck(/[\dA-Za-z]/)
