module.exports = asciiLowerAlpha

var codes = require('./codes')

function asciiLowerAlpha(code) {
  return code > codes.graveAccent && code < codes.leftCurlyBrace
}
