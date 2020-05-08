var asciiPunctuation = require('../../character/group/ascii-punctuation')

exports.tokenize = tokenizeCharacterEscape

var backslash = 92 // '\'

function tokenizeCharacterEscape(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== backslash) return nok

    effects.enter('characterEscapeSequence')
    effects.enter('characterEscapeMarker')
    effects.consume(code)
    effects.exit('characterEscapeMarker')

    return open
  }

  function open(code) {
    if (asciiPunctuation(code)) {
      effects.enter('characterEscapeCharacter')
      effects.consume(code)
      effects.exit('characterEscapeCharacter')
      effects.exit('characterEscapeSequence')
      return ok
    }

    return nok
  }
}