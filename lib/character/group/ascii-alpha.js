var asciiUpperAlpha = require('./ascii-upper-alpha')
var asciiLowerAlpha = require('./ascii-lower-alpha')

module.exports = asciiAlpha

function asciiAlpha(code) {
  return asciiUpperAlpha(code) || asciiLowerAlpha(code)
}
