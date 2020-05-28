var characters = require('../../util/characters')

module.exports = asciiUpperAlpha

function asciiUpperAlpha(code) {
  return code >= characters.uppercaseA && code <= characters.uppercaseZ
}
