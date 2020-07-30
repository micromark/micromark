module.exports = asciiLowerHexDigit

var codes = require('./codes')

function asciiLowerHexDigit(code) {
  return code > codes.graveAccent && code < codes.lowercaseG
}
