import type { types, Effects, Token } from '../types'
import markdownSpace from '../character/markdown-space'

export default function createSpaceTokenizer(type: types, max?: number) {
  var limit = (max || Infinity) - 1

  return {tokenize: tokenizeSpace, partial: true}

  function tokenizeSpace(effects: Effects, ok: any) {
    var token: Token

    return start

    function start(code: number) {
      if (markdownSpace(code)) {
        token = effects.enter(type)
        token._size = 0
        return prefix(code)
      }

      return ok(code)
    }

    function prefix(code: number) {
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
