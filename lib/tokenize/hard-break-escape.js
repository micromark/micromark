exports.tokenize = tokenizeHardBreakEscape

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')

function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.backslash) {
      return nok(code)
    }

    effects.enter(types.hardBreakEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    return open
  }

  function open(code) {
    if (markdownLineEnding(code)) {
      effects.exit(types.escapeMarker)
      effects.exit(types.hardBreakEscape)
      return ok(code)
    }

    return nok(code)
  }
}
