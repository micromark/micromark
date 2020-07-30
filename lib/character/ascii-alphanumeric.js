module.exports = asciiAlphanumeric

var codes = require('./codes')

function asciiAlphanumeric(code) {
  return (
    (code > codes.slash && code < codes.colon) ||
    (code > codes.graveAccent && code < codes.leftCurlyBrace) ||
    (code > codes.atSign && code < codes.leftSquareBracket)
  )
}
