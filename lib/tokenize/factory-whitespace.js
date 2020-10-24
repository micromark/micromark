module.exports = whitespaceFactory

var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var types = require('../constant/types')
var spaceFactory = require('./factory-space')

function whitespaceFactory(effects, ok) {
  var seen

  return start

  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      seen = true
      return start
    }

    if (markdownSpace(code)) {
      return spaceFactory(
        effects,
        start,
        seen ? types.linePrefix : types.lineSuffix
      )(code)
    }

    return ok(code)
  }
}
