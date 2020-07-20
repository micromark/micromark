module.exports = lowercase

var asciiUpperAlpha = require('../character/ascii-upper-alpha')
var constants = require('../constant/constants')

function lowercase(code) {
  return asciiUpperAlpha(code)
    ? code + constants.asciiAlphaCaseDifference
    : code
}
