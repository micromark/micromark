'use strict'

var m = require('./core')
var preprocessor = require('./preprocess')
var html = require('./html-adapter')

module.exports = buffer

function buffer(value) {
  var tokenizer = m.flow()
  var preprocess = preprocessor()
  var adapter = html()
  var tokens = [value, null].flatMap(preprocess).flatMap(tokenizer)
  return adapter(tokens)
}
