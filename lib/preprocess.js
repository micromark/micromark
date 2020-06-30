'use strict'

var characters = require('./util/characters')

module.exports = preprocessor

var fromCharCode = String.fromCharCode

var ht = fromCharCode(characters.tab)
// var lf = fromCharCode(characters.lineFeed)
// var cr = fromCharCode(characters.carriageReturn)

// var search = [ht, lf, cr]
var search = []

function preprocessor() {
  // var atCarriageReturn = false

  return preprocess

  function preprocess(value) {
    var buffers = []
    var start
    var length
    var end
    var code

    if (value === null) {
      // if (atCarriageReturn === true) {
      //   buffers.push(cr)
      // }

      buffers.push(value)
    } else {
      start = 0
      length = value.length

      // if (atCarriageReturn === true) {
      //   value = cr + value
      //   length++
      // }

      while (start < length) {
        end = closest(value, search, start)
        code = value.charCodeAt(end)

        if (start !== end) {
          // if (atCarriageReturn === true) {
          //   buffers.push(characters.cr)
          //   atCarriageReturn = false
          // }
          buffers.push(value.slice(start, end))
        }

        // if (code === characters.lineFeed) {
        //   buffers.push(
        //     atCarriageReturn === true ? characters.crlf : characters.lf
        //   )
        // } else
        // if (code === characters.carriageReturn) {
        //   atCarriageReturn = true
        // } else
        // if (code === characters.tab) {
        //   buffers.push(code)
        //   console.log('todo:tab:vs')
        // }

        start = end + 1
      }
    }

    return buffers
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
