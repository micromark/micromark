module.exports = preprocessor

var codes = require('./character/codes')
var ceil = require('./constant/ceil')
var constants = require('./constant/constants')

// To do: add `\uD800-\uDBFF` (high surrogates), \uDC00-\uDFFF (low surrogates)
// so that emoji etc are a single code point?
var search = /[\0\t\n\r]/g

function preprocessor() {
  var column = 1
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
      if (atCarriageReturn) {
        chunks.push(codes.cr)
      }

      chunks.push(value)
      return chunks
    }

    start = 0
    length = value.length

    while (start < length) {
      search.lastIndex = start
      match = search.exec(value)
      end = match ? match.index : value.length
      code = value.charCodeAt(end)

      if (start === end && atCarriageReturn && code === codes.lineFeed) {
        chunks.push(codes.crlf)
        atCarriageReturn = undefined
        column = 1
      } else {
        if (atCarriageReturn) {
          chunks.push(codes.cr)
          atCarriageReturn = undefined
        }

        if (start < end) {
          chunks.push(value.slice(start, end))
          column += end - start
        }

        if (code === codes.lineFeed) {
          chunks.push(codes.lf)
          column = 1
        } else if (code === codes.carriageReturn) {
          atCarriageReturn = true
          column = 1
        } else if (code === codes.tab) {
          next = ceil(column / constants.tabSize) * constants.tabSize
          chunks.push(codes.ht)
          while (column++ < next) chunks.push(codes.vs)
        } else if (code === codes.nul) {
          chunks.push(codes.replacementCharacter)
          column++
        }
      }

      start = end + 1
    }

    return chunks
  }
}
