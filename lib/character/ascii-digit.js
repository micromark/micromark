module.exports = asciiDigit

var fromCharCode = require('../constant/from-char-code')

function asciiDigit(code) {
  return /\d/.test(fromCharCode(code))
}
