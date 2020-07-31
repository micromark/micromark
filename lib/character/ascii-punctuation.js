module.exports = asciiPunctuation

var fromCharCode = require('../constant/from-char-code')

function asciiPunctuation(code) {
  return /[!-/:-@[-`{-~]/.test(fromCharCode(code))
}
