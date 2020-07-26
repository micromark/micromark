module.exports = classifyCharacter

var markdownEndingOrSpace = require('../character/markdown-ending-or-space')
var unicodePunctuation = require('../character/unicode-punctuation')
var unicodeWhitespace = require('../character/unicode-whitespace')
var constants = require('../constant/constants')

function classifyCharacter(code) {
  if (markdownEndingOrSpace(code) || unicodeWhitespace(code)) {
    return constants.characterGroupWhitespace
  }

  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation
  }
}
