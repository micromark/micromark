var characters = require('../../util/characters')

module.exports = asciiUpperHexDigit

function asciiUpperHexDigit(code) {
  return code >= characters.uppercaseA && code <= characters.uppercaseF
}
