var codes = require('./character/codes')
var values = require('./character/values')
var ceil = require('./constant/ceil')
var constants = require('./constant/constants')
var indexOfEach = require('./util/index-of-each')

module.exports = preprocessor

var search = [values.nul, values.tab, values.lineFeed, values.carriageReturn]

function preprocessor() {
  var atCarriageReturn
  var column = 1

  return preprocess

  function preprocess(value) {
    var stream = []
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
      end = indexOfEach(value, search, start)
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
