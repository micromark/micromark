var lowercaseA = 97 // 'a'
var lowercaseZ = 122 // 'z'

module.exports = asciiLowerAlpha

function asciiLowerAlpha(code) {
  return code >= lowercaseA && code <= lowercaseZ
}
