import {codes} from '../character/codes.js'
import {markdownSpace} from '../character/markdown-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {factorySpace} from './factory-space.js'

export const blockQuote = {
  name: 'blockQuote',
  tokenize: tokenizeBlockQuoteStart,
  continuation: {tokenize: tokenizeBlockQuoteContinuation},
  exit
}

function tokenizeBlockQuoteStart(effects, ok, nok) {
  const self = this

  return start

  function start(code) {
    if (code === codes.greaterThan) {
      if (!self.containerState.open) {
        effects.enter(types.blockQuote, {_container: true})
        self.containerState.open = true
      }

      effects.enter(types.blockQuotePrefix)
      effects.enter(types.blockQuoteMarker)
      effects.consume(code)
      effects.exit(types.blockQuoteMarker)
      return after
    }

    return nok(code)
  }

  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.blockQuotePrefixWhitespace)
      effects.consume(code)
      effects.exit(types.blockQuotePrefixWhitespace)
      effects.exit(types.blockQuotePrefix)
      return ok
    }

    effects.exit(types.blockQuotePrefix)
    return ok(code)
  }
}

function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  return factorySpace(
    effects,
    effects.attempt(blockQuote, ok, nok),
    types.linePrefix,
    this.parser.constructs.disable.null.includes('codeIndented')
      ? undefined
      : constants.tabSize
  )
}

function exit(effects) {
  effects.exit(types.blockQuote)
}
