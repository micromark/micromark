import type { Effects } from '../types'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import createSpaceTokenizer from './partial-space'

export default function tokenizeThematicBreak(effects: Effects, ok: any, nok: any) {
  var size = 0
  var marker: any

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (
      code !== codes.asterisk &&
      code !== codes.dash &&
      code !== codes.underscore
    ) {
      return nok(code)
    }

    effects.enter(types.thematicBreak)
    marker = code
    return atBreak(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'atBreak' implicitly has return type 'any' because... Remove this comment to see the full error message
  function atBreak(code: any) {
    if (code === marker) {
      effects.enter(types.thematicBreakSequence)
      return sequence(code)
    }

    if (markdownSpace(code)) {
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        atBreak
      )(code)
    }

    if (
      size < constants.thematicBreakMarkerCountMin ||
      (code !== codes.eof && !markdownLineEnding(code))
    ) {
      return nok(code)
    }

    effects.exit(types.thematicBreak)
    return ok(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'sequence' implicitly has return type 'any' becaus... Remove this comment to see the full error message
  function sequence(code: any) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)
    return atBreak(code)
  }
}
