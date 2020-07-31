module.exports = asciiImfAtextOrDot

var fromCharCode = require('../constant/from-char-code')

function asciiImfAtextOrDot(code) {
  return /[#-'*+\--9=?A-Z^-~]/.test(fromCharCode(code))
}
