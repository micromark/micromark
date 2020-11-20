var lineEnding = {
  tokenize: tokenizeLineEnding
}
export default lineEnding

import assert from 'assert'
import markdownLineEnding from '../character/markdown-line-ending'
import * as types from '../constant/types'
import spaceFactory from './factory-space'

function tokenizeLineEnding(effects, ok) {
  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return spaceFactory(effects, ok, types.linePrefix)
  }
}
