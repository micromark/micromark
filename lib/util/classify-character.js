module.exports = classifyCharacter

var codes = require('../character/codes')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var unicodePunctuation = require('../character/unicode-punctuation')
var unicodeWhitespace = require('../character/unicode-whitespace')
var constants = require('../constant/constants')

function classifyCharacter(code) {
  if (
    code === codes.eof ||
    markdownLineEndingOrSpace(code) ||
    unicodeWhitespace(code)
  ) {
    return constants.characterGroupWhitespace
  }

  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation
  }
}
