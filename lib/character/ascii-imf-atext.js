module.exports = imfAtext

var codes = require('./codes')
var asciiAlphanumeric = require('./ascii-alphanumeric')

function imfAtext(code) {
  return (
    asciiAlphanumeric(code) ||
    (code > codes.quotationMark && code < codes.leftParenthesis) ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    code === codes.dash ||
    code === codes.slash ||
    code === codes.equalsTo ||
    code === codes.questionMark ||
    (code > codes.rightSquareBracket && code < codes.lowercaseA) ||
    (code > codes.lowercaseZ && code < codes.del)
  )
}
