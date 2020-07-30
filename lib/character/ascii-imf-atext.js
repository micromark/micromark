module.exports = imfAtext

var codes = require('./codes')

function imfAtext(code) {
  return (
    (code > codes.quotationMark && code < codes.leftParenthesis) ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    (code > codes.dash && code < codes.colon) ||
    code === codes.equalsTo ||
    code === codes.questionMark ||
    (code > codes.atSign && code < codes.leftSquareBracket) ||
    (code > codes.rightSquareBracket && code < codes.del)
  )
}
