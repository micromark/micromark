module.exports = asciiAlphanumeric

var fromCharCode = require('../constant/from-char-code')

function asciiAlphanumeric(code) {
  return /[\dA-Za-z]/.test(fromCharCode(code))
}
