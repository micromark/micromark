exports.tokenize = tokenizePartialBlankLine
exports.partial = true

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')
var spaceFactory = require('./factory-space')

function tokenizePartialBlankLine(effects, ok, nok) {
  return spaceFactory(effects, afterWhitespace, types.linePrefix)

  function afterWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
