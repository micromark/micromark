var characters = require('../../util/characters')

module.exports = asciiPunctuation

function asciiPunctuation(code) {
  return (
    (code >= characters.exclamationMark && code <= characters.slash) ||
    (code >= characters.colon && code <= characters.atSign) ||
    (code >= characters.leftSquareBracket && code <= characters.graveAccent) ||
    (code >= characters.leftCurlyBrace && code <= characters.tilde)
  )
}
