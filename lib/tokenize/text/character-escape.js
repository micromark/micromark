var asciiPunctuation = require('../../character/group/ascii-punctuation')

exports.tokenize = tokenizeCharacterEscape

function tokenizeCharacterEscape(effects, ok, nok) {
  effects.enter('characterEscapeSequence')
  effects.enter('characterEscapeMarker')
  effects.consume()
  effects.exit('characterEscapeMarker')

  return after

  function after(code) {
    if (asciiPunctuation(code)) {
      effects.enter('characterEscapeCharacter')
      effects.consume()
      effects.exit('characterEscapeCharacter')
      effects.exit('characterEscapeSequence')
      return ok
    }

    return nok
  }
}
