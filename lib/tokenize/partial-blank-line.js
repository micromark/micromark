exports.tokenize = tokenizePartialBlankLine
exports.partial = true

var markdownLineEnding = require('../character/markdown-line-ending')
var codes = require('../character/codes')
var types = require('../constant/types')
var spaceFactory = require('./factory-space')

function tokenizePartialBlankLine(effects, ok, nok) {
  return spaceFactory(effects, afterWhitespace, types.linePrefix)

  function afterWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
