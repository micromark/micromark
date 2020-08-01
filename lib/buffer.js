module.exports = buffer

var codes = require('./character/codes')
var compiler = require('./compile/html')
var flatMap = require('./util/flat-map')
var parser = require('./parse')
var preprocessor = require('./preprocess')
var postprocessor = require('./postprocess')

// To do: can we support actual buffers?
function buffer(value, options) {
  var preprocess = preprocessor()
  var postprocess = postprocessor()
  var compile = compiler(options)
  var tokenizer = parser().flow()
  compile(
    postprocess(flatMap(flatMap([value, codes.eof], preprocess), tokenizer))
  )
  return compile(codes.eof)
}
