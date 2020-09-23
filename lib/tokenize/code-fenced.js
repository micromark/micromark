exports.tokenize = tokenizeCodeFenced
exports.resolve = resolveCodeFenced
exports.concrete = true

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var prefixSize = require('../util/prefix-size')
var createSpaceTokenizer = require('./partial-space')

function resolveCodeFenced(events) {
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
      [events[length - 1]],
      events.slice(-3, -1)
    )
  }

  return events
}

function tokenizeCodeFenced(effects, ok, nok) {
  var self = this
  var closingFence = {tokenize: tokenizeClosingFence, partial: true}
  var initialPrefix = prefixSize(this.events)
  var sizeOpen = 0
  var marker

  return start

  function start(code) {
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

  function sequenceOpen(code) {
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

  function infoOpen(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceInfo)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return info(code)
  }

  function info(code) {
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

  function infoAfter(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceMeta)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return meta(code)
  }

  function meta(code) {
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

  function openAfter(code) {
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

  function lineStart(code) {
    if (initialPrefix) {
      return effects.attempt(
        createSpaceTokenizer(types.linePrefix, initialPrefix + 1),
        afterPrefix
      )(code)
    }

    return afterPrefix(code)
  }

  function afterPrefix(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return lineEnd(code)
    }

    effects.enter(types.codeFlowValue)
    return lineData(code)
  }

  function lineData(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return lineEnd(code)
    }

    effects.consume(code)
    return lineData
  }

  function lineEnd(code) {
    if (code === codes.eof) {
      return after(code)
    }

    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(closingFence, after, lineStart)
  }

  function after(code) {
    effects.exit(types.codeFenced)
    return ok(code)
  }

  function tokenizeClosingFence(effects, ok, nok) {
    var size = 0

    return effects.attempt(
      createSpaceTokenizer(types.linePrefix, constants.tabSize),
      closingPrefixAfter
    )

    function closingPrefixAfter(code) {
      if (code === marker) {
        effects.enter(types.codeFencedFence)
        effects.enter(types.codeFencedFenceSequence)
        return closingSequence(code)
      }

      return nok(code)
    }

    function closingSequence(code) {
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

    function closingSequenceEnd(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(types.codeFencedFence)
        return ok(code)
      }

      return nok(code)
    }
  }
}
