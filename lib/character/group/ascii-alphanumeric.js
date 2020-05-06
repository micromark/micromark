var asciiDigit = require('./ascii-digit')
var asciiAlpha = require('./ascii-alpha')

module.exports = asciiAlphanumeric

function asciiAlphanumeric(code) {
  return asciiDigit(code) || asciiAlpha(code)
}
