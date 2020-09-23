module.exports = createSpaceTokenizer

var markdownSpace = require('../character/markdown-space')

function createSpaceTokenizer(type, max) {
  var limit = (max || Infinity) - 1

  return {tokenize: tokenizeSpace, partial: true}

  function tokenizeSpace(effects, ok) {
    var token

    return start

    function start(code) {
      if (markdownSpace(code)) {
        token = effects.enter(type, {_size: 0})
        return prefix(code)
      }

      return ok(code)
    }

    function prefix(code) {
      if (token._size < limit && markdownSpace(code)) {
        effects.consume(code)
        token._size++
        return prefix
      }

      effects.exit(type)
      return ok(code)
    }
  }
}
