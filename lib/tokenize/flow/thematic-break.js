exports.tokenize = tokenizeThematicBreak

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '
var asterisk = 42 // '*'
var dash = 45 // '-'
var underscore = 95 // '_'

var min = 3

function tokenizeThematicBreak(effects, ok, nok) {
  var size = 0
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== asterisk && code !== dash && code !== underscore) {
      return nok(code)
    }

    effects.enter('thematicBreak')
    effects.enter('thematicBreakSequence')
    marker = code
    return sequence
  }

  function sequence(code) {
    if (code === tab || code === space) {
      effects.exit('thematicBreakSequence')
      effects.enter('thematicBreakWhitespace')
      return whitespace
    }

    if (code === marker) {
      size++
      effects.consume(code)
      return sequence
    }

    if (size >= min && (code !== code || code === lineFeed)) {
      effects.exit('thematicBreakSequence')
      return after(code)
    }

    return nok(code)
  }

  function whitespace(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return whitespace
    }

    if (code === marker) {
      effects.exit('thematicBreakWhitespace')
      effects.enter('thematicBreakSequence')
      return sequence
    }

    if (size >= min && (code !== code || code === lineFeed)) {
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
