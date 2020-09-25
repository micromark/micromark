module.exports = createSpaceOrLineEndingTokenizer

var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var types = require('../constant/types')
var createSpace = require('./factory-space')

function createSpaceOrLineEndingTokenizer(effects, ok) {
  return start

  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return start
    }

    if (markdownSpace(code)) {
      return createSpace(effects, start, types.whitespace)(code)
    }

    return ok(code)
  }
}
