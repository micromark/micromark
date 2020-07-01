'use strict'

var characters = require('./util/characters')

module.exports = preprocessor

var fromCharCode = String.fromCharCode

// var ht = fromCharCode(characters.tab)
var lf = fromCharCode(characters.lineFeed)
var cr = fromCharCode(characters.carriageReturn)

// var search = [ht, lf, cr]
var search = [lf, cr]

function preprocessor() {
  var atCarriageReturn = false

  return preprocess

  function preprocess(value) {
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
    } else {
      start = 0
      length = value.length

      if (atCarriageReturn === true) {
        value = cr + value
        atCarriageReturn = false
        length++
      }

      while (start < length) {
        end = closest(value, search, start)
        code = value.charCodeAt(end)

        if (start !== end) {
          if (atCarriageReturn === true) {
            stream.push(characters.cr)
            atCarriageReturn = false
          }

          stream.push(value.slice(start, end))
        }

        if (code === characters.lineFeed) {
          stream.push(
            atCarriageReturn === true ? characters.crlf : characters.lf
          )
          atCarriageReturn = false
        } else if (code === characters.carriageReturn) {
          atCarriageReturn = true
        }
        // else if (code === characters.tab) {
        //   stream.push(code)
        // }

        start = end + 1
      }
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
