var m = require('./core')
var codes = require('./character/codes')
var preprocessor = require('./preprocess')
var html = require('./html-adapter')
var flatMap = require('./util/flat-map')

module.exports = buffer

// To do: can we support actual buffers?
function buffer(value, options) {
  var tokens = flatMap(flatMap([value, codes.eof], preprocessor()), m.flow())
  return html(options)(tokens)
}
