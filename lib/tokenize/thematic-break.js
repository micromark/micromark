exports.tokenize = tokenizeThematicBreak

var codes = require('../character/codes')
var markdownEnding = require('../character/markdown-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')

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
    effects.enter(types.thematicBreakSequence)
    marker = code
    return sequence(code)
  }

  function sequence(code) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      return whitespace(code)
    }

    return after(code)
  }

  function whitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespace
    }

    effects.exit(types.whitespace)

    if (code === marker) {
      effects.enter(types.thematicBreakSequence)
      return sequence(code)
    }

    return after(code)
  }

  function after(code) {
    if (size < constants.thematicBreakMarkerCountMin || !markdownEnding(code)) {
      return nok(code)
    }

    effects.exit(types.thematicBreak)
    return ok(code)
  }
}
