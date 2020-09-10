import type { Effects, Okay, Token } from '../types'
import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as types from '../constant/types'

export const partial = true

export const tokenize = function tokenizeSpaceOrLineEnding(effects: Effects, ok: Okay) {
  var token: Token

  return start

  // @ts-expect-error ts-migrate(7023) FIXME: 'start' implicitly has return type 'any' because i... Remove this comment to see the full error message
  function start(code: number) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return start
    }

    if (markdownSpace(code)) {
      token = effects.enter(types.whitespace)
      token._size = 0
      return whitespace(code)
    }

    return ok(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'whitespace' implicitly has return type 'any' beca... Remove this comment to see the full error message
  function whitespace(code: number) {
    if (markdownSpace(code)) {
      effects.consume(code)
      token._size++
      return whitespace
    }

    effects.exit(types.whitespace)
    return start(code)
  }
}
