module.exports = preprocessor

var codes = require('./character/codes')
var ceil = require('./constant/ceil')
var constants = require('./constant/constants')

var search = /[\0\t\n\r]/g

function preprocessor() {
  var column = 1
  var buffer = ''
  var atCarriageReturn

  return preprocess

  function preprocess(value) {
    var chunks = []
    var match
    var next
    var start
    var length
    var end
    var code

    if (value === codes.eof) {
      if (atCarriageReturn) chunks.push(codes.cr)
      if (buffer) chunks.push(buffer)
      chunks.push(value)
      return chunks
    }

    value = buffer + value
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

      if (start === end && atCarriageReturn && code === codes.lineFeed) {
        chunks.push(codes.crlf)
        atCarriageReturn = undefined
      } else {
        if (atCarriageReturn) {
          chunks.push(codes.cr)
          atCarriageReturn = undefined
        }

        if (start < end) {
          chunks.push(value.slice(start, end))
          column += end - start
        }

        if (code === codes.nul) {
          chunks.push(codes.replacementCharacter)
          column++
        } else if (code === codes.tab) {
          next = ceil(column / constants.tabSize) * constants.tabSize
          chunks.push(codes.ht)
          while (column++ < next) chunks.push(codes.vs)
        } else if (code === codes.lineFeed) {
          chunks.push(codes.lf)
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
