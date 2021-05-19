/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Code} Code
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownLineEndingOrSpace} from '../character/markdown-line-ending-or-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {prefixSize} from '../util/prefix-size.js'
import {factorySpace} from './factory-space.js'

/** @type {Construct} */
export const codeFenced = {
  name: 'codeFenced',
  tokenize: tokenizeCodeFenced,
  concrete: true
}

/** @type {Tokenize} */
function tokenizeCodeFenced(effects, ok, nok) {
  const self = this
  /** @type {Construct} */
  const closingFenceConstruct = {tokenize: tokenizeClosingFence, partial: true}
  const initialPrefix = prefixSize(this.events, types.linePrefix)
  let sizeOpen = 0
  /** @type {NonNullable<Code>} */
  let marker

  return start

  /** @type {State} */
  function start(code) {
    assert(
      code === codes.graveAccent || code === codes.tilde,
      'expected `` ` `` or `~`'
    )
    effects.enter(types.codeFenced)
    effects.enter(types.codeFencedFence)
    effects.enter(types.codeFencedFenceSequence)
    marker = code
    return sequenceOpen(code)
  }

  /** @type {State} */
  function sequenceOpen(code) {
    if (code === marker) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    effects.exit(types.codeFencedFenceSequence)
    return sizeOpen < constants.codeFencedSequenceSizeMin
      ? nok(code)
      : factorySpace(effects, infoOpen, types.whitespace)(code)
  }

  /** @type {State} */
  function infoOpen(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceInfo)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return info(code)
  }

  /** @type {State} */
  function info(code) {
    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      effects.exit(types.chunkString)
      effects.exit(types.codeFencedFenceInfo)
      return factorySpace(effects, infoAfter, types.whitespace)(code)
    }

    if (code === codes.graveAccent && code === marker) return nok(code)
    effects.consume(code)
    return info
  }

  /** @type {State} */
  function infoAfter(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceMeta)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return meta(code)
  }

  /** @type {State} */
  function meta(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      effects.exit(types.codeFencedFenceMeta)
      return openAfter(code)
    }

    if (code === codes.graveAccent && code === marker) return nok(code)
    effects.consume(code)
    return meta
  }

  /** @type {State} */
  function openAfter(code) {
    effects.exit(types.codeFencedFence)
    return self.interrupt ? ok(code) : content(code)
  }

  /** @type {State} */
  function content(code) {
    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(
        closingFenceConstruct,
        after,
        initialPrefix
          ? factorySpace(effects, content, types.linePrefix, initialPrefix + 1)
          : content
      )
    }

    effects.enter(types.codeFlowValue)
    return contentContinue(code)
  }

  /** @type {State} */
  function contentContinue(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return content(code)
    }

    effects.consume(code)
    return contentContinue
  }

  /** @type {State} */
  function after(code) {
    effects.exit(types.codeFenced)
    return ok(code)
  }

  /** @type {Tokenize} */
  function tokenizeClosingFence(effects, ok, nok) {
    let size = 0

    return factorySpace(
      effects,
      closingSequenceStart,
      types.linePrefix,
      this.parser.constructs.disable.null.includes('codeIndented')
        ? undefined
        : constants.tabSize
    )

    /** @type {State} */
    function closingSequenceStart(code) {
      effects.enter(types.codeFencedFence)
      effects.enter(types.codeFencedFenceSequence)
      return closingSequence(code)
    }

    /** @type {State} */
    function closingSequence(code) {
      if (code === marker) {
        effects.consume(code)
        size++
        return closingSequence
      }

      if (size < sizeOpen) return nok(code)
      effects.exit(types.codeFencedFenceSequence)
      return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
    }

    /** @type {State} */
    function closingSequenceEnd(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(types.codeFencedFence)
        return ok(code)
      }

      return nok(code)
    }
  }
}
