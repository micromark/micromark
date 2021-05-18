/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Resolve} Resolve
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').Token} Token
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {prefixSize} from '../util/prefix-size.js'
import {subtokenize} from '../util/subtokenize.js'
import {factorySpace} from './factory-space.js'

/**
 * No name because it must not be turned off.
 *
 * @type {Construct}
 */
export const content = {
  tokenize: tokenizeContent,
  resolve: resolveContent,
  interruptible: true,
  lazy: true
}

/** @type {Construct} */
const continuationConstruct = {tokenize: tokenizeContinuation, partial: true}

/**
 * Content is transparent: it’s parsed right now. That way, definitions are also
 * parsed right now: before text in paragraphs (specifically, media) are parsed.
 *
 * @type {Resolve}
 */
function resolveContent(events) {
  subtokenize(events)
  return events
}

/** @type {Tokenize} */
function tokenizeContent(effects, ok) {
  /** @type {Token} */
  let previous

  return start

  /** @type {State} */
  function start(code) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected no eof or eol'
    )

    effects.enter(types.content)
    previous = effects.enter(types.chunkContent, {
      contentType: constants.contentTypeContent
    })
    return data(code)
  }

  /** @type {State} */
  function data(code) {
    if (code === codes.eof) {
      return contentEnd(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(
        continuationConstruct,
        contentContinue,
        contentEnd
      )(code)
    }

    // Data.
    effects.consume(code)
    return data
  }

  /** @type {State} */
  function contentEnd(code) {
    effects.exit(types.chunkContent)
    effects.exit(types.content)
    return ok(code)
  }

  /** @type {State} */
  function contentContinue(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.consume(code)
    effects.exit(types.chunkContent)
    previous.next = effects.enter(types.chunkContent, {
      contentType: constants.contentTypeContent,
      previous
    })
    previous = previous.next
    return data
  }
}

/** @type {Tokenize} */
function tokenizeContinuation(effects, ok, nok) {
  const self = this

  return startLookahead

  /** @type {State} */
  function startLookahead(code) {
    assert(markdownLineEnding(code), 'expected a line ending')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return factorySpace(effects, prefixed, types.linePrefix)
  }

  /** @type {State} */
  function prefixed(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code)
    }

    if (
      self.parser.constructs.disable.null.includes('codeIndented') ||
      prefixSize(self.events, types.linePrefix) < constants.tabSize
    ) {
      return effects.interrupt(self.parser.constructs.flow, nok, ok)(code)
    }

    return ok(code)
  }
}
