module.exports = lowercase

var codes = require('../character/codes')
var constants = require('../constant/constants')

// Lowercase a character code.
function lowercase(code) {
  return code > codes.atSign && code < codes.leftSquareBracket
    ? code + constants.asciiAlphaCaseDifference
    : code
}
