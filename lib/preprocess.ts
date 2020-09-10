import * as codes from './character/codes'
import ceil from './constant/ceil'
import * as constants from './constant/constants'

var search = /[\0\t\n\r]/g

export default function preprocessor() {
  var column = 1
  var buffer = ''
  var atCarriageReturn: boolean | undefined

  return preprocess

  function preprocess(value: Buffer | string | null, encoding?: string) {
    var chunks = []
    var match
    var next
    var start
    var length
    var end
    var code

    if (value === codes.eof) {
      if (atCarriageReturn) chunks.push(codes.carriageReturn)
      if (buffer) chunks.push(buffer)
      chunks.push(value)
      return chunks
    }

    value = buffer + value.toString(encoding)
    length = value.length
    start = 0
    buffer = ''

    while (start < length) {
      search.lastIndex = start
      match = search.exec(value)
      end = match ? match.index : length
      code = value.charCodeAt(end)

      if (!match) {
        buffer = value.slice(start)
        break
      }

      if (start === end && atCarriageReturn && code === codes.lf) {
        chunks.push(codes.carriageReturnLineFeed)
        atCarriageReturn = undefined
      } else {
        if (atCarriageReturn) {
          chunks.push(codes.carriageReturn)
          atCarriageReturn = undefined
        }

        if (start < end) {
          chunks.push(value.slice(start, end))
          column += end - start
        }

        if (code === codes.nul) {
          chunks.push(codes.replacementCharacter)
          column++
        } else if (code === codes.ht) {
          next = ceil(column / constants.tabSize) * constants.tabSize
          chunks.push(codes.horizontalTab)
          while (column++ < next) chunks.push(codes.virtualSpace)
        } else if (code === codes.lf) {
          chunks.push(codes.lineFeed)
          column = 1
        }
        // Must be carriage return.
        else {
          atCarriageReturn = true
          column = 1
        }
      }

      start = end + 1
    }

    return chunks
  }
}
