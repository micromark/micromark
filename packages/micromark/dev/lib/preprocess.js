/**
 * @typedef {import('../index.js').Chunk} Chunk
 * @typedef {import('../index.js').Code} Code
 */

/**
 * @typedef {'ascii'|'utf8'|'utf-8'|'utf16le'|'ucs2'|'ucs-2'|'base64'|'latin1'|'binary'|'hex'} Encoding
 *   Encodings supported by the buffer class.
 *   This is a copy of the typing from Node, copied to prevent Node globals from
 *   being needed.
 *   Copied from: <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/a2bc1d8/types/node/globals.d.ts#L174>
 *
 * @typedef {string|Uint8Array} Value
 *   Contents of the file.
 *   Can either be text, or a `Buffer` like structure.
 *   This does not directly use type `Buffer`, because it can also be used in a
 *   browser context.
 *   Instead this leverages `Uint8Array` which is the base type for `Buffer`,
 *   and a native JavaScript construct.
 *
 * @callback Preprocessor
 * @param {Value} value
 * @param {Encoding} [encoding]
 * @param {boolean} [end=false]
 * @returns {Chunk[]}
 */

import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'

const search = /[\0\t\n\r]/g

/**
 * @returns {Preprocessor}
 */
export function preprocess() {
  let column = 1
  let buffer = ''
  /** @type {boolean|undefined} */
  let start = true
  /** @type {boolean|undefined} */
  let atCarriageReturn

  return preprocessor

  /** @type {Preprocessor} */
  function preprocessor(value, encoding, end) {
    /** @type {Chunk[]} */
    const chunks = []
    /** @type {RegExpMatchArray|null} */
    let match
    /** @type {number} */
    let next
    /** @type {number} */
    let startPosition
    /** @type {number} */
    let endPosition
    /** @type {Code} */
    let code

    // @ts-expect-error `Buffer` does allow an encoding.
    value = buffer + value.toString(encoding)
    startPosition = 0
    buffer = ''

    if (start) {
      if (value.charCodeAt(0) === codes.byteOrderMarker) {
        startPosition++
      }

      start = undefined
    }

    while (startPosition < value.length) {
      search.lastIndex = startPosition
      match = search.exec(value)
      endPosition =
        match && match.index !== undefined ? match.index : value.length
      code = value.charCodeAt(endPosition)

      if (!match) {
        buffer = value.slice(startPosition)
        break
      }

      if (
        code === codes.lf &&
        startPosition === endPosition &&
        atCarriageReturn
      ) {
        chunks.push(codes.carriageReturnLineFeed)
        atCarriageReturn = undefined
      } else {
        if (atCarriageReturn) {
          chunks.push(codes.carriageReturn)
          atCarriageReturn = undefined
        }

        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition))
          column += endPosition - startPosition
        }

        switch (code) {
          case codes.nul: {
            chunks.push(codes.replacementCharacter)
            column++

            break
          }

          case codes.ht: {
            next = Math.ceil(column / constants.tabSize) * constants.tabSize
            chunks.push(codes.horizontalTab)
            while (column++ < next) chunks.push(codes.virtualSpace)

            break
          }

          case codes.lf: {
            chunks.push(codes.lineFeed)
            column = 1

            break
          }

          default: {
            atCarriageReturn = true
            column = 1
          }
        }
      }

      startPosition = endPosition + 1
    }

    if (end) {
      if (atCarriageReturn) chunks.push(codes.carriageReturn)
      if (buffer) chunks.push(buffer)
      chunks.push(codes.eof)
    }

    return chunks
  }
}
