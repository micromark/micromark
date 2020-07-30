module.exports = asciiUpperAlpha

var codes = require('./codes')

function asciiUpperAlpha(code) {
  return code > codes.atSign && code < codes.leftSquareBracket
}
