'use strict'

var m = require('./core')
var html = require('./html-adapter')

module.exports = buffer

function buffer(value) {
  var tokenizer = m('text')
  var adapter = html()

  return [].concat(adapter(tokenizer(value)), adapter(tokenizer(null))).join('')
}
