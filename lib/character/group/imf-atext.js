var characters = require('../../util/characters')
var asciiAlphanumeric = require('./ascii-alphanumeric')

module.exports = imfAtext

function imfAtext(code) {
  return (
    asciiAlphanumeric(code) ||
    (code >= characters.numberSign && code <= characters.apostrophe) ||
    code === characters.asterisk ||
    code === characters.plusSign ||
    code === characters.dash ||
    code === characters.slash ||
    code === characters.equalsTo ||
    code === characters.questionMark ||
    (code >= characters.graveAccent && code <= characters.caret) ||
    (code >= characters.leftCurlyBrace && code <= characters.tilde)
  )
}
