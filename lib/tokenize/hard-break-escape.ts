import type { Effects, NotOkay, Okay } from '../types'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as types from '../constant/types'

export const tokenizer = function tokenizeHardBreakEscape(effects: Effects, ok: Okay, nok: NotOkay) {
  return start

  function start(code: number) {
    // istanbul ignore next - Hooks.
    if (code !== codes.backslash) {
      return nok(code)
    }

    effects.enter(types.hardBreakEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    return open
  }

  function open(code: number) {
    if (markdownLineEnding(code)) {
      effects.exit(types.escapeMarker)
      effects.exit(types.hardBreakEscape)
      return ok(code)
    }

    return nok(code)
  }
}
