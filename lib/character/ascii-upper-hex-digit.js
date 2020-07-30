module.exports = asciiUpperHexDigit

var codes = require('./codes')

function asciiUpperHexDigit(code) {
  return code >= codes.uppercaseA && code <= codes.uppercaseF
}
