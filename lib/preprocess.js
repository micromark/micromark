'use strict'

var characters = require('./util/characters')

module.exports = preprocessor

var fromCharCode = String.fromCharCode

var ht = fromCharCode(characters.tab)
var lf = fromCharCode(characters.lineFeed)
var cr = fromCharCode(characters.carriageReturn)

var search = [ht, lf, cr]
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
        stream.push(characters.cr)
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

      if (start === end && atCarriageReturn && code === characters.lineFeed) {
        stream.push(characters.crlf)
        atCarriageReturn = false
        column = 1
      } else {
        if (atCarriageReturn === true) {
          stream.push(characters.cr)
          atCarriageReturn = false
        }

        if (start !== end) {
          stream.push(value.slice(start, end))
          column += end - start
        }

        if (code === characters.lineFeed) {
          stream.push(characters.lf)
          column = 1
        } else if (code === characters.carriageReturn) {
          atCarriageReturn = true
          column = 1
        } else if (code === characters.tab) {
          next = Math.ceil(column / tabSize) * tabSize
          stream.push(characters.ht)
          while (++column <= next) stream.push(characters.vs)
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
