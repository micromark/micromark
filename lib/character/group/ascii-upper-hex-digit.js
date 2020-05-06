var uppercaseA = 65 // 'A'
var uppercaseF = 70 // 'F'

module.exports = asciiUpperHexDigit

function asciiUpperHexDigit(code) {
  return code >= uppercaseA && code <= uppercaseF
}
