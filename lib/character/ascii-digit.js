var codes = require('./codes')

module.exports = asciiDigit

function asciiDigit(code) {
  return code >= codes.digit0 && code <= codes.digit9
}
