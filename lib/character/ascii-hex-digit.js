module.exports = asciiHexDigit

var fromCharCode = require('../constant/from-char-code')

function asciiHexDigit(code) {
  return /[\dA-Fa-f]/.test(fromCharCode(code))
}
