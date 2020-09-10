exports.tokenize = tokenizeHardBreakEscape

import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import types from '../constant/types'

function tokenizeHardBreakEscape(effects: any, ok: any, nok: any) {
  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.backslash) {
      return nok(code)
    }

    effects.enter(types.hardBreakEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    return open
  }

  function open(code: any) {
    if (markdownLineEnding(code)) {
      effects.exit(types.escapeMarker)
      effects.exit(types.hardBreakEscape)
      return ok(code)
    }

    return nok(code)
  }
}
