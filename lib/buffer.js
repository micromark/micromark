'use strict'

var m = require('./core')
var h = require('./html-adapter')

module.exports = buffer

function buffer(value) {
  var slices = []
  var write = m(h(callback))

  write(value)
  write(NaN)

  return slices.join('')

  function callback(slice) {
    slices.push(slice)
  }
}
