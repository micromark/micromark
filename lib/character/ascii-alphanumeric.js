module.exports = asciiAlphanumeric

var asciiDigit = require('./ascii-digit')
var asciiAlpha = require('./ascii-alpha')

function asciiAlphanumeric(code) {
  return asciiDigit(code) || asciiAlpha(code)
}
