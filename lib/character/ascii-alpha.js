import {regexCheck} from '../util/regex-check.js'

/**
 * Check whether the character code represents an ASCII alpha (`a` though `z`,
 * case insensitive).
 *
 * An **ASCII alpha** is an ASCII upper alpha or ASCII lower alpha.
 *
 * An **ASCII upper alpha** is a character in the inclusive range U+0041 (`A`)
 * to U+005A (`Z`).
 *
 * An **ASCII lower alpha** is a character in the inclusive range U+0061 (`a`)
 * to U+007A (`z`).
 */
export const asciiAlpha = regexCheck(/[A-Za-z]/)
