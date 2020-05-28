var characters = require('../../util/characters')

module.exports = asciiDigit

function asciiDigit(code) {
  return code >= characters.digit0 && code <= characters.digit9
}
