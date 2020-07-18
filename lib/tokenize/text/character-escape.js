exports.tokenize = tokenizeCharacterEscape

var codes = require('../../character/codes')
var asciiPunctuation = require('../../character/ascii-punctuation')

function tokenizeCharacterEscape(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.backslash) return nok(code)

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
      return ok(code)
    }

    return nok(code)
  }
}
