var digit0 = 48 // '0'
var digit9 = 57 // '9'

module.exports = asciiDigit

function asciiDigit(code) {
  return code >= digit0 && code <= digit9
}
