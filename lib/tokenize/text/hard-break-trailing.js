exports.tokenize = tokenizeHardBreakTrailing

var characters = require('../../util/characters')

var min = 2

// To do: change this, if we put trailing spaces somehow into newline codes.
function tokenizeHardBreakTrailing(effects, ok, nok) {
  var size = 0

  // Can’t start after a space, we already checked this.
  if (effects.previous === characters.space) {
    return nok
  }

  return state

  function state(code) {
    if (
      size >= min &&
      (code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf)
    ) {
      effects.exit('hardBreakTrailing')
      return ok(code)
    }

    if (code === characters.space) {
      if (size === 0) {
        effects.enter('hardBreakTrailing')
      }

      effects.consume(code)
      size++
      return state
    }

    return nok(code)
  }
}
