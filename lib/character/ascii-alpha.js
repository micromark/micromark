module.exports = asciiAlpha

var codes = require('./codes')

function asciiAlpha(code) {
  return (
    (code > codes.graveAccent && code < codes.leftCurlyBrace) ||
    (code > codes.atSign && code < codes.leftSquareBracket)
  )
}
