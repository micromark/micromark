var lowercaseA = 97 // 'a'
var lowercaseF = 102 // 'f'

module.exports = asciiLowerHexDigit

function asciiLowerHexDigit(code) {
  return code >= lowercaseA && code <= lowercaseF
}
