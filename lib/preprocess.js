var codes = require('./character/codes')
var ceil = require('./constant/ceil')
var constants = require('./constant/constants')

module.exports = preprocessor

// To do: add `\uD800-\uDBFF` (high surrogates), \uDC00-\uDFFF (low surrogates)
// so that emoji etc are a single code point?
var search = /[\0\t\n\r]/g

function preprocessor() {
  var atCarriageReturn
  var column = 1

  return preprocess

  function preprocess(value) {
    var stream = []
    var match
    var next
    var start
    var length
    var end
    var code

    if (value === codes.eof) {
      if (atCarriageReturn) {
        stream.push(codes.cr)
        atCarriageReturn = undefined
      }

      stream.push(value)
      return stream
    }

    start = 0
    length = value.length

    while (start < length) {
      search.lastIndex = start
      match = search.exec(value)
      end = match ? match.index : value.length
      code = value.charCodeAt(end)

      if (start === end && atCarriageReturn && code === codes.lineFeed) {
        stream.push(codes.crlf)
        atCarriageReturn = undefined
        column = 1
      } else {
        if (atCarriageReturn) {
          stream.push(codes.cr)
          atCarriageReturn = undefined
        }

        if (start !== end) {
          stream.push(value.slice(start, end))
          column += end - start
        }

        if (code === codes.lineFeed) {
          stream.push(codes.lf)
          column = 1
        } else if (code === codes.carriageReturn) {
          atCarriageReturn = true
          column = 1
        } else if (code === codes.tab) {
          next = ceil(column / constants.tabSize) * constants.tabSize
          stream.push(codes.ht)
          while (++column <= next) stream.push(codes.vs)
        } else if (code === codes.nul) {
          stream.push(codes.replacementCharacter)
          column++
        }
      }

      start = end + 1
    }

    return stream
  }
}
