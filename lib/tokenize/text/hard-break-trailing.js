exports.tokenize = tokenizeHardBreakTrailing

var lineFeed = 10 // '\n'
var space = 32 // ' '

var min = 2

function tokenizeHardBreakTrailing(effects, ok, nok) {
  var size = 0

  // Can’t start after a space, we already checked this.
  if (effects.previous === space) {
    return nok
  }

  return state

  function state(code) {
    if (code === lineFeed && size >= min) {
      effects.exit('hardBreakTrailing')
      return ok
    }

    if (code === space) {
      if (size === 0) {
        effects.enter('hardBreakTrailing')
      }

      effects.consume(code)
      size++
      return state
    }

    return nok
  }
}
