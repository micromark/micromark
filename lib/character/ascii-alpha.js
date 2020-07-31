module.exports = asciiAlpha

var fromCharCode = require('../constant/from-char-code')

function asciiAlpha(code) {
  return /[A-Za-z]/.test(fromCharCode(code))
}
