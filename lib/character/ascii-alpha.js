module.exports = asciiAlpha

var asciiUpperAlpha = require('./ascii-upper-alpha')
var asciiLowerAlpha = require('./ascii-lower-alpha')

function asciiAlpha(code) {
  return asciiUpperAlpha(code) || asciiLowerAlpha(code)
}
