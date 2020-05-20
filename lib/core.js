'use strict'

var tokenizer = require('./tokenizer')
var text = require('./text')
var plainText = require('./plain-text')

exports.text = create(text)
exports.plainText = create(plainText)

function create(initializer) {
  return creator
  function creator() {
    return tokenizer(initializer)
  }
}
