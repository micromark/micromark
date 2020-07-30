module.exports = asciiDigit

var codes = require('./codes')

function asciiDigit(code) {
  return code > codes.slash && code < codes.colon
}
