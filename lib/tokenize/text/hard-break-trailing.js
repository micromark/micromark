exports.tokenize = tokenizeHardBreakTrailing

var characters = require('../../util/characters')

var min = 2

// To do: this should be changed when `newline` “codes” exist.
function tokenizeHardBreakTrailing(effects, ok, nok) {
  var size = 0

  // Can’t start after a space, we already checked this.
  if (effects.previous === characters.space) {
    return nok
  }

  return state

  function state(code) {
    if (code === characters.lineFeed && size >= min) {
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
