exports.tokenize = tokenizeCodeFenced
exports.resolve = resolveCodeFenced

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
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
  var interrupt = this.check
  var previous = this.queue[this.queue.length - 1]
  var initialPrefix =
    previous && previous[1].type === types.linePrefix
      ? previous[1].end.column - previous[1].start.column
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
    if (markdownEnding(code)) {
      return interrupt ? ok(code) : openAfter(code)
    }

    effects.enter(types.codeFencedFenceInfo).contentType = 'string'
    return info(code)
  }

  function info(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (markdownEnding(code)) {
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

    if (markdownEnding(code)) {
      return openAfter(code)
    }

    effects.enter(types.codeFencedFenceMeta).contentType = 'string'
    return meta(code)
  }

  function meta(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (markdownEnding(code)) {
      effects.exit(types.codeFencedFenceMeta)
      return openAfter(code)
    }

    effects.consume(code)
    return meta
  }

  function openAfter(code) {
    effects.exit(types.codeFencedFence)

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return next
    }

    assert.equal(code, codes.eof, 'expected EOF')
    return after(code)
  }

  function lineStart(code) {
    if (markdownEnding(code)) {
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

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    effects.enter(types.codeFlowValue)
    return lineData(code)
  }

  function lineData(code) {
    if (markdownEnding(code)) {
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

    assert(markdownLineEnding(code), 'expected EOF or EOL')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return next
  }

  function next(code) {
    return effects.createConstructAttempt(closingFence, after, lineStart)(code)
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
      if (markdownSpace(code) && ++size < constants.tabSize) {
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
      if (markdownEnding(code)) {
        effects.exit(types.codeFencedFence)
        return ok(code)
      }

      return nok(code)
    }
  }
}
