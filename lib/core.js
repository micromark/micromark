'use strict'

var createTokenizer = require('./util/create-tokenizer')
var text = require('./tokenizer/text-tokenizer')
var plainText = require('./tokenizer/plain-text-tokenizer')
var flow = require('./tokenizer/flow-tokenizer')

exports.flow = create(flow)
exports.text = create(text)
exports.plainText = create(plainText)

function create(initializer) {
  return creator
  function creator(from) {
    return createTokenizer(initializer, from)
  }
}
