module.exports = asciiLowerHexDigit

var codes = require('./codes')

function asciiLowerHexDigit(code) {
  return code >= codes.lowercaseA && code <= codes.lowercaseF
}
