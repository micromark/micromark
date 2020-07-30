module.exports = buffer

var codes = require('./character/codes')
var compiler = require('./compile/html')
var flatMap = require('./util/flat-map')
var parser = require('./parse')
var preprocessor = require('./preprocess')

// To do: can we support actual buffers?
function buffer(value, options) {
  var tokenizer = parser().flow()
  var tokens = flatMap(flatMap([value, codes.eof], preprocessor()), tokenizer)
  return compiler(options)(tokens)
}
