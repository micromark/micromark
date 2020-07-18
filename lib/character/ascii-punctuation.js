var codes = require('./codes')

module.exports = asciiPunctuation

function asciiPunctuation(code) {
  return (
    (code >= codes.exclamationMark && code <= codes.slash) ||
    (code >= codes.colon && code <= codes.atSign) ||
    (code >= codes.leftSquareBracket && code <= codes.graveAccent) ||
    (code >= codes.leftCurlyBrace && code <= codes.tilde)
  )
}
