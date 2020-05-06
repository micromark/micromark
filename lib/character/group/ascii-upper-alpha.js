var uppercaseA = 65 // 'A'
var uppercaseZ = 90 // 'Z'

module.exports = asciiUpperAlpha

function asciiUpperAlpha(code) {
  return code >= uppercaseA && code <= uppercaseZ
}
