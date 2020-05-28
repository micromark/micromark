var characters = require('../../util/characters')

module.exports = asciiLowerAlpha

function asciiLowerAlpha(code) {
  return code >= characters.lowercaseA && code <= characters.lowercaseZ
}
