exports.tokenize = tokenizeBlankLine
exports.partial = true

var markdownLineEnding = require('../character/markdown-line-ending')
var codes = require('../character/codes')
var types = require('../constant/types')
var createSpaceTokenizer = require('./partial-space')

// To do: what type should this be?
function tokenizeBlankLine(effects, ok, nok) {
  return effects.attempt(
    createSpaceTokenizer(types.whitespace),
    afterWhitespace
  )

  function afterWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
