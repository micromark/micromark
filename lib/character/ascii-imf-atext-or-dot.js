module.exports = asciiImfAtextOrDot

var codes = require('./codes')

function asciiImfAtextOrDot(code) {
  return (
    (code > codes.quotationMark && code < codes.leftParenthesis) ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    (code > codes.comma && code < codes.colon) ||
    code === codes.equalsTo ||
    code === codes.questionMark ||
    (code > codes.atSign && code < codes.leftSquareBracket) ||
    (code > codes.rightSquareBracket && code < codes.del)
  )
}
