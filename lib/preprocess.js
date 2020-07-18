'use strict'

var codes = require('./character/codes')
var fromCharCode = require('./constant/from-char-code')

module.exports = preprocessor

var search = [
  fromCharCode(codes.nul),
  fromCharCode(codes.tab),
  fromCharCode(codes.lineFeed),
  fromCharCode(codes.carriageReturn)
]
var tabSize = 4

function preprocessor() {
  var atCarriageReturn = false
  var column = 1

  return preprocess

  function preprocess(value) {
    var next
    var stream = []
    var start
    var length
    var end
    var code

    if (value === null) {
      if (atCarriageReturn === true) {
        stream.push(codes.cr)
        atCarriageReturn = false
      }

      stream.push(value)
      return stream
    }

    start = 0
    length = value.length

    while (start < length) {
      end = closest(value, search, start)
      code = value.charCodeAt(end)

      if (start === end && atCarriageReturn && code === codes.lineFeed) {
        stream.push(codes.crlf)
        atCarriageReturn = false
        column = 1
      } else {
        if (atCarriageReturn === true) {
          stream.push(codes.cr)
          atCarriageReturn = false
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
          next = Math.ceil(column / tabSize) * tabSize
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

function closest(value, list, fromIndex) {
  var index = -1
  var length = list.length
  var earliest = value.length
  var position

  while (++index < length) {
    position = value.indexOf(list[index], fromIndex)

    if (position !== -1 && position < earliest) {
      earliest = position
    }
  }

  return earliest
}
