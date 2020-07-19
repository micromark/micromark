var m = require('./core')
var codes = require('./character/codes')
var preprocessor = require('./preprocess')
var html = require('./html-adapter')
var flatMap = require('./util/flatmap')

module.exports = buffer

function buffer(value) {
  var tokens = flatMap(flatMap([value, codes.eof], preprocessor()), m.flow())
  return html()(tokens)
}
