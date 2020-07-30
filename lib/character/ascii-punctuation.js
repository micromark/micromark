module.exports = asciiPunctuation

var codes = require('./codes')

function asciiPunctuation(code) {
  return (
    (code >= codes.exclamationMark && code <= codes.slash) ||
    (code >= codes.colon && code <= codes.atSign) ||
    (code >= codes.leftSquareBracket && code <= codes.graveAccent) ||
    (code >= codes.leftCurlyBrace && code <= codes.tilde)
  )
}
