exports.tokenize = tokenizeThematicBreak

var characters = require('../../util/characters')

var min = 3

function tokenizeThematicBreak(effects, ok, nok) {
  var size = 0
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (
      code !== characters.asterisk &&
      code !== characters.dash &&
      code !== characters.underscore
    ) {
      return nok(code)
    }

    effects.enter('thematicBreak')
    effects.enter('thematicBreakSequence')
    marker = code
    return sequence
  }

  function sequence(code) {
    if (code === characters.tab || code === characters.space) {
      effects.exit('thematicBreakSequence')
      effects.enter('thematicBreakWhitespace')
      return whitespace
    }

    if (code === marker) {
      size++
      effects.consume(code)
      return sequence
    }

    if (
      size >= min &&
      (code === characters.eof ||
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf)
    ) {
      effects.exit('thematicBreakSequence')
      return after(code)
    }

    return nok(code)
  }

  function whitespace(code) {
    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return whitespace
    }

    if (code === marker) {
      effects.exit('thematicBreakWhitespace')
      effects.enter('thematicBreakSequence')
      return sequence
    }

    if (
      size >= min &&
      (code === characters.eof ||
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf)
    ) {
      effects.exit('thematicBreakWhitespace')
      return after(code)
    }

    return nok(code)
  }

  function after(code) {
    effects.exit('thematicBreak')
    return ok(code)
  }
}
