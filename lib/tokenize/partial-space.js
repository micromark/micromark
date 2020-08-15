module.exports = createSpaceTokenizer

var markdownSpace = require('../character/markdown-space')

function createSpaceTokenizer(type, max) {
  var limit = max || Infinity

  return {tokenize: tokenizeSpace, partial: true}

  function tokenizeSpace(effects, ok) {
    var size = 0

    return start

    function start(code) {
      if (markdownSpace(code)) {
        effects.enter(type)
        return prefix(code)
      }

      return ok(code)
    }

    function prefix(code) {
      if (++size < limit && markdownSpace(code)) {
        effects.consume(code)
        return prefix
      }

      effects.exit(type)
      return ok(code)
    }
  }
}
