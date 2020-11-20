var hardBreakEscape = {
  tokenize: tokenizeHardBreakEscape
}
export default hardBreakEscape

import assert from 'assert'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as types from '../constant/types'

function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  function start(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter(types.hardBreakEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    return open
  }

  function open(code) {
    if (markdownLineEnding(code)) {
      effects.exit(types.escapeMarker)
      effects.exit(types.hardBreakEscape)
      return ok(code)
    }

    return nok(code)
  }
}
