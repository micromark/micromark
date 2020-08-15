exports.tokenize = tokenizeThematicBreak

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var createSpaceTokenizer = require('./partial-space')

function tokenizeThematicBreak(effects, ok, nok) {
  var size = 0
  var marker

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (
      code !== codes.asterisk &&
      code !== codes.dash &&
      code !== codes.underscore
    ) {
      return nok(code)
    }

    effects.enter(types.thematicBreak)
    marker = code
    return atBreak(code)
  }

  function atBreak(code) {
    if (code === marker) {
      effects.enter(types.thematicBreakSequence)
      return sequence(code)
    }

    if (markdownSpace(code)) {
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        atBreak
      )(code)
    }

    if (
      size < constants.thematicBreakMarkerCountMin ||
      (code !== codes.eof && !markdownLineEnding(code))
    ) {
      return nok(code)
    }

    effects.exit(types.thematicBreak)
    return ok(code)
  }

  function sequence(code) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)
    return atBreak(code)
  }
}
