var codes = require('./codes')

module.exports = asciiUpperHexDigit

function asciiUpperHexDigit(code) {
  return code >= codes.uppercaseA && code <= codes.uppercaseF
}
