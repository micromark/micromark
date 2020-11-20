var thematicBreak = {
  tokenize: tokenizeThematicBreak
}
export default thematicBreak

import assert from 'assert'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import spaceFactory from './factory-space'

function tokenizeThematicBreak(effects, ok, nok) {
  var size = 0
  var marker

  return start

  function start(code) {
    assert(
      code === codes.asterisk ||
        code === codes.dash ||
        code === codes.underscore,
      'expected `*`, `-`, or `_`'
    )

    effects.enter(types.thematicBreak)
    marker = code
    return atBreak(code)
  }

  function atBreak(code) {
    if (code === marker) {
      effects.enter(types.thematicBreakSequence)
      return sequence(code)
    }

    if (markdownSpace(code)) {
      return spaceFactory(effects, atBreak, types.whitespace)(code)
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

  function sequence(code) {
    if (code === marker) {
      effects.consume(code)
      size++
      return sequence
    }

    effects.exit(types.thematicBreakSequence)
    return atBreak(code)
  }
}
