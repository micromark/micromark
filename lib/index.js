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

  return compiler(options)(
    postprocessor()(
      flatMap(
        flatMap([value, codes.eof], preprocessor(), encoding),
        parser(options).document().write
      )
    )
  )
}
