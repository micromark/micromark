module.exports = asciiHexDigit

var codes = require('./codes')

function asciiHexDigit(code) {
  return (
    (code > codes.slash && code < codes.colon) ||
    (code > codes.atSign && code < codes.uppercaseG) ||
    (code > codes.graveAccent && code < codes.lowercaseG)
  )
}
