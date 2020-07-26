exports.tokenize = tokenizeThematicBreak

var codes = require('../../character/codes')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var types = require('../../constant/types')

function tokenizeThematicBreak(effects, ok, nok) {
  var self = this
  var size = 0
  var marker

  return start

  function start(code) {
    if (
      code !== codes.asterisk &&
      code !== codes.dash &&
      code !== codes.underscore
    ) {
      return nok(code)
    }

    // Do not allow `---` to interrupt content.
    // To do: if it cannot be a setext underline, *do* interrupt.
    if (self.check && code === codes.dash) {
      return nok(code)
    }

    effects.enter(types.thematicBreak)
    effects.enter(types.thematicBreakSequence)
    marker = code
    return sequence
  }

  function sequence(code) {
    if (markdownSpace(code)) {
      effects.exit(types.thematicBreakSequence)
      effects.enter(types.whitespace)
      return whitespace
    }

    if (code === marker) {
      size++
      effects.consume(code)
      return sequence
    }

    if (size >= constants.minThematicBreakMarkerCount && markdownEnding(code)) {
      effects.exit(types.thematicBreakSequence)
      return after(code)
    }

    return nok(code)
  }

  function whitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespace
    }

    if (code === marker) {
      effects.exit(types.whitespace)
      effects.enter(types.thematicBreakSequence)
      return sequence
    }

    if (size >= constants.minThematicBreakMarkerCount && markdownEnding(code)) {
      effects.exit(types.whitespace)
      return after(code)
    }

    return nok(code)
  }

  function after(code) {
    effects.exit(types.thematicBreak)
    return ok(code)
  }
}
