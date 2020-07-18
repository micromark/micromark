var codes = require('./codes')

module.exports = asciiLowerHexDigit

function asciiLowerHexDigit(code) {
  return code >= codes.lowercaseA && code <= codes.lowercaseF
}
