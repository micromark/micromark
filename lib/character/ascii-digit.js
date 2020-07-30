module.exports = asciiDigit

var codes = require('./codes')

function asciiDigit(code) {
  return code >= codes.digit0 && code <= codes.digit9
}
