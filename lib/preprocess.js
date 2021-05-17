import {codes} from './character/codes.js'
import {constants} from './constant/constants.js'

const search = /[\0\t\n\r]/g

export function preprocess() {
  let start = true
  let column = 1
  let buffer = ''
  let atCarriageReturn

  return preprocessor

  function preprocessor(value, encoding, end) {
    const chunks = []
    let match
    let next
    let startPosition
    let endPosition
    let code

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
      endPosition = match ? match.index : value.length
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
