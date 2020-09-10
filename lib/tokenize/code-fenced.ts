exports.tokenize = tokenizeCodeFenced
exports.resolve = resolveCodeFenced
exports.concrete = true

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEndingOrSpace'.
import markdownLineEndingOrSpace from '../character/markdown-line-ending-or-space'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'prefixSize'.
import prefixSize from '../util/prefix-size'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

function resolveCodeFenced(events: any) {
  var length = events.length
  var index = -1
  var fences = 0

  while (++index < length) {
    if (
      events[index][0] === 'enter' &&
      events[index][1].type === types.codeFencedFence
    ) {
      fences++
    }
  }

  // If there is no closing fence, but there is a final line ending, move it out
  // of the code.
  if (fences < 2 && events[length - 3][1].type === types.lineEnding) {
    return [].concat(
      events.slice(0, -3),
      // @ts-expect-error ts-migrate(2769) FIXME: Type 'any' is not assignable to type 'never'.
      [events[length - 1]],
      events.slice(-3, -1)
    )
  }

  return events
}

function tokenizeCodeFenced(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var initialPrefix = prefixSize(this.events)
  var closingFence = {tokenize: tokenizeClosingFence, partial: true}
  var sizeOpen = 0
  var marker: any

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.graveAccent && code !== codes.tilde) {
      return nok(code)
    }

    effects.enter(types.codeFenced)
    effects.enter(types.codeFencedFence)
    effects.enter(types.codeFencedFenceSequence)
    marker = code
    return sequenceOpen(code)
  }

  function sequenceOpen(code: any) {
    if (code === marker) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    if (sizeOpen < constants.codeFencedSequenceSizeMin) {
      return nok(code)
    }

    effects.exit(types.codeFencedFenceSequence)
    return effects.attempt(
      createSpaceTokenizer(types.whitespace),
      infoOpen
    )(code)
  }

  function infoOpen(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceInfo)
    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return info(code)
  }

  function info(code: any) {
    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      effects.exit(types.chunkString)
      effects.exit(types.codeFencedFenceInfo)
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        infoAfter
      )(code)
    }

    if (code === marker && marker === codes.graveAccent) {
      return nok(code)
    }

    effects.consume(code)
    return info
  }

  function infoAfter(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceMeta)
    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return meta(code)
  }

  function meta(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      effects.exit(types.codeFencedFenceMeta)
      return openAfter(code)
    }

    if (code === marker && marker === codes.graveAccent) {
      return nok(code)
    }

    effects.consume(code)
    return meta
  }

  function openAfter(code: any) {
    effects.exit(types.codeFencedFence)

    if (self.interrupt) {
      return ok(code)
    }

    if (code === codes.eof) {
      return after(code)
    }

    assert(markdownLineEnding(code), 'expected eol or eof')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(closingFence, after, lineStart)
  }

  function lineStart(code: any) {
    if (initialPrefix) {
      return effects.attempt(
        createSpaceTokenizer(types.linePrefix, initialPrefix + 1),
        afterPrefix
      )(code)
    }

    return afterPrefix(code)
  }

  function afterPrefix(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return lineEnd(code)
    }

    effects.enter(types.codeFlowValue)
    return lineData(code)
  }

  function lineData(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return lineEnd(code)
    }

    effects.consume(code)
    return lineData
  }

  function lineEnd(code: any) {
    if (code === codes.eof) {
      return after(code)
    }

    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(closingFence, after, lineStart)
  }

  function after(code: any) {
    effects.exit(types.codeFenced)
    return ok(code)
  }

  function tokenizeClosingFence(effects: any, ok: any, nok: any) {
    var size = 0

    return effects.attempt(
      createSpaceTokenizer(types.linePrefix, constants.tabSize),
      closingPrefixAfter
    )

    function closingPrefixAfter(code: any) {
      if (code === marker) {
        effects.enter(types.codeFencedFence)
        effects.enter(types.codeFencedFenceSequence)
        return closingSequence(code)
      }

      return nok(code)
    }

    function closingSequence(code: any) {
      if (code === marker) {
        effects.consume(code)
        size++
        return closingSequence
      }

      if (size < sizeOpen) {
        return nok(code)
      }

      effects.exit(types.codeFencedFenceSequence)
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        closingSequenceEnd
      )(code)
    }

    function closingSequenceEnd(code: any) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(types.codeFencedFence)
        return ok(code)
      }

      return nok(code)
    }
  }
}
