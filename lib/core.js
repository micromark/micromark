var createTokenizer = require('./util/create-tokenizer')
var content = require('./tokenizer/content-tokenizer')
var flow = require('./tokenizer/flow-tokenizer')
var plainText = require('./tokenizer/plain-text-tokenizer')
var text = require('./tokenizer/text-tokenizer')

exports.content = create(content)
exports.flow = create(flow)
exports.plainText = create(plainText)
exports.text = create(text)

function create(initializer) {
  return creator
  function creator(from) {
    return createTokenizer(initializer, from)
  }
}
