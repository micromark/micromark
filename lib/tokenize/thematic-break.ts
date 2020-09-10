import type { Effects, NotOkay, Okay } from '../types'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import createSpaceTokenizer from './partial-space'

export default function tokenizeThematicBreak(effects: Effects, ok: Okay, nok: NotOkay) {
  var size = 0
  var marker: number

  return start

  function start(code: number) {
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

  function atBreak(code: number): unknown {
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

  function sequence(code: number) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)
    return atBreak(code)
  }
}
