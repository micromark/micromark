module.exports = asciiUpperHexDigit

var codes = require('./codes')

function asciiUpperHexDigit(code) {
  return code > codes.atSign && code < codes.uppercaseG
}
