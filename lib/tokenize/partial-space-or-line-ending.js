exports.tokenize = tokenizeSpaceOrLineEnding
exports.partial = true

var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var types = require('../constant/types')

function tokenizeSpaceOrLineEnding(effects, ok) {
  return start

  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return start
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return whitespace
    }

    return ok(code)
  }

  function whitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespace
    }

    effects.exit(types.whitespace)
    return start(code)
  }
}
