var parser = require('./parse')
var codes = require('./character/codes')
var preprocessor = require('./preprocess')
var html = require('./html-adapter')
var flatMap = require('./util/flat-map')

module.exports = buffer

// To do: can we support actual buffers?
function buffer(value, options) {
  var tokenizer = parser().flow()
  var tokens = flatMap(flatMap([value, codes.eof], preprocessor()), tokenizer)
  return html(options)(tokens)
}
