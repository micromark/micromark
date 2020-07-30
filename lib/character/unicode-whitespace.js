module.exports = whitespace

var fromCharCode = require('../constant/from-char-code')

function whitespace(code) {
  return /\s/.test(fromCharCode(code))
}
