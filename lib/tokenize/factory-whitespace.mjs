export default whitespaceFactory

import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as types from '../constant/types'
import spaceFactory from './factory-space'

function whitespaceFactory(effects, ok) {
  var seen

  return start

  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      seen = true
      return start
    }

    if (markdownSpace(code)) {
      return spaceFactory(
        effects,
        start,
        seen ? types.linePrefix : types.lineSuffix
      )(code)
    }

    return ok(code)
  }
}
