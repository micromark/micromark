var characters = require('../../util/characters')

module.exports = asciiControl

function asciiControl(code) {
  return (
    (code >= characters.nil && code <= characters.us) || code === characters.del
  )
}
