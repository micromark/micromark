var asciiPunctuation = require('../../character/group/ascii-punctuation')

exports.tokenize = tokenizeCharacterEscape

function tokenizeCharacterEscape(effects, ok, nok) {
  effects.enter('escapeSequence')
  effects.enter('escapeMarker')
  effects.consume()
  effects.exit('escapeMarker')

  return after

  function after(code) {
    if (asciiPunctuation(code)) {
      effects.enter('escapeCharacter')
      effects.consume()
      effects.exit('escapeCharacter')
      effects.exit('escapeSequence')
      return ok
    }

    return nok
  }
}
