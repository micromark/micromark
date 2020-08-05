exports.tokenize = tokenizeCodeFenced
exports.resolve = resolveCodeFenced

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')

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
  var closingFence = {tokenize: tokenizeClosingFence}
  var interrupt = this.interrupt
  var tail = this.events[this.events.length - 1]
  var initialPrefix =
    tail && tail[1].type === types.linePrefix
      ? tail[1].end.column - tail[1].start.column
      : 0
  var sizeOpen = 0
  var prefix
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

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return sequenceAfter
    }

    return infoOpen(code)
  }

  function sequenceAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return sequenceAfter
    }

    effects.exit(types.whitespace)
    return infoOpen(code)
  }

  function infoOpen(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return interrupt ? ok(code) : openAfter(code)
    }

    effects.enter(types.codeFencedFenceInfo).contentType =
      constants.contentTypeString
    return info(code)
  }

  function info(code) {
    if (code === marker && marker === codes.graveAccent) {
      return nok(code)
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFencedFenceInfo)
      return openAfter(code)
    }

    if (markdownSpace(code)) {
      effects.exit(types.codeFencedFenceInfo)
      effects.enter(types.whitespace)
      return infoAfter(code)
    }

    effects.consume(code)
    return info
  }

  function infoAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return infoAfter
    }

    effects.exit(types.whitespace)

    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceMeta).contentType =
      constants.contentTypeString
    return meta(code)
  }

  function meta(code) {
    if (code === marker && marker === codes.graveAccent) {
      return nok(code)
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFencedFenceMeta)
      return openAfter(code)
    }

    effects.consume(code)
    return meta
  }

  function openAfter(code) {
    effects.exit(types.codeFencedFence)

    if (code === codes.eof) {
      return after(code)
    }

    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return next
  }

  function lineStart(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return lineEnd(code)
    }

    if (initialPrefix && markdownSpace(code)) {
      effects.enter(types.linePrefix)
      prefix = 0
      return linePrefix(code)
    }

    effects.enter(types.codeFlowValue)
    return lineData(code)
  }

  function linePrefix(code) {
    if (prefix++ < initialPrefix && markdownSpace(code)) {
      effects.consume(code)
      return linePrefix
    }

    effects.exit(types.linePrefix)

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
    return next
  }

  function next(code) {
    return effects.attempt(closingFence, after, lineStart)(code)
  }

  function after(code) {
    effects.exit(types.codeFenced)
    return ok(code)
  }

  function tokenizeClosingFence(effects, ok, nok) {
    var size = 0

    return closingStart

    function closingStart(code) {
      if (markdownSpace(code)) {
        effects.enter(types.linePrefix)
        return closingPrefix(code)
      }

      return closingPrefixAfter(code)
    }

    function closingPrefix(code) {
      if (++size < constants.tabSize && markdownSpace(code)) {
        effects.consume(code)
        return closingPrefix
      }

      effects.exit(types.linePrefix)
      return closingPrefixAfter(code)
    }

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

      if (markdownSpace(code)) {
        effects.enter(types.whitespace)
        return closingSequenceAfter(code)
      }

      return closingSequenceEnd(code)
    }

    function closingSequenceAfter(code) {
      if (markdownSpace(code)) {
        effects.consume(code)
        return closingSequenceAfter
      }

      effects.exit(types.whitespace)
      return closingSequenceEnd(code)
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
