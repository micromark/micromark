'use strict'

var m = require('./core')
var html = require('./html-adapter')

module.exports = buffer

function buffer(value) {
  var tokenizer = m.text()
  var adapter = html()
  var a = adapter(tokenizer(value))
  var b = adapter(tokenizer(null))

  return [].concat(a, b).join('')
}
