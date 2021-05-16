import assert from 'assert'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

export const lineEnding = {
  name: 'lineEnding',
  tokenize: tokenizeLineEnding
}

function tokenizeLineEnding(effects, ok) {
  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return factorySpace(effects, ok, types.linePrefix)
  }
}
