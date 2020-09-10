module.exports = createSpaceTokenizer

import markdownSpace from '../character/markdown-space'

function createSpaceTokenizer(type: any, max: number) {
  var limit = (max || Infinity) - 1

  return {tokenize: tokenizeSpace, partial: true}

  function tokenizeSpace(effects: any, ok: any) {
    var token: any

    return start

    function start(code: any) {
      if (markdownSpace(code)) {
        token = effects.enter(type)
        token._size = 0
        return prefix(code)
      }

      return ok(code)
    }

    function prefix(code: any) {
      if (token._size < limit && markdownSpace(code)) {
        token._size++
        effects.consume(code)
        return prefix
      }

      effects.exit(type)
      return ok(code)
    }
  }
}
