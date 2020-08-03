module.exports = asciiAtext

var fromCharCode = require('../constant/from-char-code')

// Also includes dot.
function asciiAtext(code) {
  return /[#-'*+\--9=?A-Z^-~]/.test(fromCharCode(code))
}
