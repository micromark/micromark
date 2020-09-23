exports.tokenize = tokenizeSpaceOrLineEnding
exports.partial = true

var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var types = require('../constant/types')

function tokenizeSpaceOrLineEnding(effects, ok) {
  var token

  return start

  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return start
    }

    if (markdownSpace(code)) {
      token = effects.enter(types.whitespace, {_size: 0})
      return whitespace(code)
    }

    return ok(code)
  }

  function whitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      token._size++
      return whitespace
    }

    effects.exit(types.whitespace)
    return start(code)
  }
}
