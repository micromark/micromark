exports.tokenize = tokenizeSpaceOrLineEnding
exports.partial = true

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
import types from '../constant/types'

function tokenizeSpaceOrLineEnding(effects: any, ok: any) {
  var token: any

  return start

  // @ts-expect-error ts-migrate(7023) FIXME: 'start' implicitly has return type 'any' because i... Remove this comment to see the full error message
  function start(code: any) {
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
  function whitespace(code: any) {
    if (markdownSpace(code)) {
      effects.consume(code)
      token._size++
      return whitespace
    }

    effects.exit(types.whitespace)
    return start(code)
  }
}
