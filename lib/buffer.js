module.exports = buffer

var codes = require('./character/codes')
var compiler = require('./compile/html')
var flatMap = require('./util/flat-map')
var parser = require('./parse')
var preprocessor = require('./preprocess')
var postprocessor = require('./postprocess')

function buffer(value, encoding, options) {
  if (typeof encoding !== 'string') {
    options = encoding
    encoding = undefined
  }

  var preprocess = preprocessor()
  var postprocess = postprocessor()
  var tokenizer = parser().document()
  var compile = compiler(options)

  return compile(
    postprocess(
      flatMap(flatMap([value, codes.eof], preprocess, encoding), tokenizer)
    )
  )
}
