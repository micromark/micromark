exports.tokenize = tokenizeThematicBreak

var codes = require('../../character/codes')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')

function tokenizeThematicBreak(effects, ok, nok) {
  var self = this
  var size = 0
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
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

    effects.enter('thematicBreak')
    effects.enter('thematicBreakSequence')
    marker = code
    return sequence
  }

  function sequence(code) {
    if (markdownSpace(code)) {
      effects.exit('thematicBreakSequence')
      effects.enter('thematicBreakWhitespace')
      return whitespace
    }

    if (code === marker) {
      size++
      effects.consume(code)
      return sequence
    }

    if (size >= constants.minThematicBreakMarkerCount && markdownEnding(code)) {
      effects.exit('thematicBreakSequence')
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
      effects.exit('thematicBreakWhitespace')
      effects.enter('thematicBreakSequence')
      return sequence
    }

    if (size >= constants.minThematicBreakMarkerCount && markdownEnding(code)) {
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
