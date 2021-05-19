import {asciiAlphanumeric} from '../character/ascii-alphanumeric.js'
import {codes} from '../character/codes.js'
import {values} from '../character/values.js'
import {fromCharCode} from '../constant/from-char-code.js'

/**
 * Normalize a URL (such as used in definitions).
 *
 * Encode unsafe characters with percent-encoding, skipping already encoded
 * sequences.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeUri(value) {
  /** @type {string[]} */
  const result = []
  let index = -1
  let start = 0
  let skip = 0

  while (++index < value.length) {
    const code = value.charCodeAt(index)
    /** @type {string} */
    let replace = ''

    // A correct percent encoded value.
    if (
      code === codes.percentSign &&
      asciiAlphanumeric(value.charCodeAt(index + 1)) &&
      asciiAlphanumeric(value.charCodeAt(index + 2))
    ) {
      skip = 2
    }
    // ASCII.
    else if (code < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(fromCharCode(code))) {
        replace = fromCharCode(code)
      }
    }
    // Astral.
    else if (code > 55295 && code < 57344) {
      const next = value.charCodeAt(index + 1)

      // A correct surrogate pair.
      if (code < 56320 && next > 56319 && next < 57344) {
        replace = fromCharCode(code, next)
        skip = 1
      }
      // Lone surrogate.
      else {
        replace = values.replacementCharacter
      }
    }
    // Unicode.
    else {
      replace = fromCharCode(code)
    }

    if (replace) {
      result.push(value.slice(start, index), encodeURIComponent(replace))
      start = index + skip + 1
      replace = ''
    }

    if (skip) {
      index += skip
      skip = 0
    }
  }

  return result.join('') + value.slice(start)
}
