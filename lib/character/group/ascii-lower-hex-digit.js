var characters = require('../../util/characters')

module.exports = asciiLowerHexDigit

function asciiLowerHexDigit(code) {
  return code >= characters.lowercaseA && code <= characters.lowercaseF
}
