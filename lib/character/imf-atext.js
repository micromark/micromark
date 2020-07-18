var codes = require('./codes')
var asciiAlphanumeric = require('./ascii-alphanumeric')

module.exports = imfAtext

function imfAtext(code) {
  return (
    asciiAlphanumeric(code) ||
    (code >= codes.numberSign && code <= codes.apostrophe) ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    code === codes.dash ||
    code === codes.slash ||
    code === codes.equalsTo ||
    code === codes.questionMark ||
    (code >= codes.graveAccent && code <= codes.caret) ||
    (code >= codes.leftCurlyBrace && code <= codes.tilde)
  )
}
