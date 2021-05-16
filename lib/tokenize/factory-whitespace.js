import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownSpace} from '../character/markdown-space.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

export function factoryWhitespace(effects, ok) {
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
      return factorySpace(
        effects,
        start,
        seen ? types.linePrefix : types.lineSuffix
      )(code)
    }

    return ok(code)
  }
}
