/**
 * @typedef {import('../micromark/index.js').Construct} Construct
 * @typedef {import('../micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../micromark/index.js').Resolver} Resolver
 * @typedef {import('../micromark/index.js').Token} Token
 * @typedef {import('../micromark/index.js').State} State
 */

import {codes} from '../micromark-core-symbol/codes.js'
import {markdownLineEnding} from '../micromark-core-character/index.js'
import {constants} from '../micromark-core-symbol/constants.js'
import {types} from '../micromark-core-symbol/types.js'
import {splice} from '../micromark-util-chunked/index.js'
import {factorySpace} from '../micromark-factory-space/index.js'

/** @type {Construct} */
export const codeIndented = {
  name: 'codeIndented',
  tokenize: tokenizeCodeIndented,
  resolve: resolveCodeIndented
}

/** @type {Construct} */
const indentedContentConstruct = {
  tokenize: tokenizeIndentedContent,
  partial: true
}

/** @type {Resolver} */
function resolveCodeIndented(events, context) {
  /** @type {Token} */
  const code = {
    type: types.codeIndented,
    start: events[0][1].start,
    end: events[events.length - 1][1].end
  }

  splice(events, 0, 0, [['enter', code, context]])
  splice(events, events.length, 0, [['exit', code, context]])

  return events
}

/** @type {Tokenizer} */
function tokenizeCodeIndented(effects, ok, nok) {
  return effects.attempt(indentedContentConstruct, afterPrefix, nok)

  /** @type {State} */
  function afterPrefix(code) {
    if (code === codes.eof) {
      return ok(code)
    }

    if (markdownLineEnding(code)) {
      return effects.attempt(indentedContentConstruct, afterPrefix, ok)(code)
    }

    effects.enter(types.codeFlowValue)
    return content(code)
  }

  /** @type {State} */
  function content(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return afterPrefix(code)
    }

    effects.consume(code)
    return content
  }
}

/** @type {Tokenizer} */
function tokenizeIndentedContent(effects, ok, nok) {
  const self = this

  return factorySpace(
    effects,
    afterPrefix,
    types.linePrefix,
    constants.tabSize + 1
  )

  /** @type {State} */
  function afterPrefix(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return factorySpace(
        effects,
        afterPrefix,
        types.linePrefix,
        constants.tabSize + 1
      )
    }

    const tail = self.events[self.events.length - 1]

    return tail &&
      tail[1].type === types.linePrefix &&
      tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize
      ? ok(code)
      : nok(code)
  }
}
