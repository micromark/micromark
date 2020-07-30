module.exports = asciiHexDigit

var asciiDigit = require('./ascii-digit')
var asciiUpperHexDigit = require('./ascii-upper-hex-digit')
var asciiLowerHexDigit = require('./ascii-lower-hex-digit')

function asciiHexDigit(code) {
  return (
    asciiDigit(code) || asciiUpperHexDigit(code) || asciiLowerHexDigit(code)
  )
}
