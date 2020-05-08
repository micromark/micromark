'use strict'

var m = require('./core')

module.exports = buffer

function buffer(value) {
  var slices = []
  var write = m(callback)

  write(value)
  write(NaN)

  return '<p>' + slices.join('') + '</p>'

  function callback(slice) {
    slices.push(slice)
  }
}
