exports.tokenize = tokenizeFencedCode
exports.resolve = resolveFencedCode

var assert = require('assert')
var core = require('../../core')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var tokenizeEvent = require('../../util/tokenize-event')

function resolveFencedCode(events) {
  var result = []
  var index = -1
  var length = events.length
  var infoEnter
  var metaEnter
  var type
  var event

  while (++index < length) {
    event = events[index]
    type = event[1].type

    if (event[0] === 'enter') {
      if (type === 'fencedCodeFenceInfo') {
        infoEnter = index
      } else if (type === 'fencedCodeFenceMeta') {
        metaEnter = index
      }
    }

    if (event[0] === 'exit' && type === 'fencedCodeFenceStart') {
      break
    }
  }

  if (infoEnter === undefined) {
    result = events
  } else {
    result = result.concat(
      events.slice(0, infoEnter + 1),
      tokenizeEvent(events[infoEnter], core.plainText)
    )

    if (metaEnter === undefined) {
      result = result.concat(events.slice(infoEnter + 1))
    } else {
      result = result.concat(
        events.slice(infoEnter + 1, metaEnter + 1),
        tokenizeEvent(events[metaEnter], core.plainText),
        events.slice(metaEnter + 1)
      )
    }
  }

  return result
}

function tokenizeFencedCode(effects, ok, nok) {
  var queue = this.queue
  var closingFence = {tokenize: tokenizeClosingFence}
  var previous = queue[queue.length - 1]
  var sizeOpen = 0
  var prefixSize
  var marker
  var initialPrefixSize =
    previous && previous[1].type === 'linePrefix'
      ? previous[1].end.column - previous[1].start.column
      : 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.graveAccent && code !== codes.tilde) {
      return nok(code)
    }

    effects.enter('fencedCode')
    effects.enter('fencedCodeFenceStart')
    effects.enter('fencedCodeFenceSequence')

    marker = code

    return sequenceOpen
  }

  function sequenceOpen(code) {
    if (code === marker) {
      sizeOpen++
      effects.consume(code)
      return sequenceOpen
    }

    if (sizeOpen < constants.minFencedCodeFenceSize) {
      return nok(code)
    }

    effects.exit('fencedCodeFenceSequence')

    if (markdownEnding(code)) {
      return openAfter(code)
    }

    if (markdownSpace(code)) {
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return sequenceOpenAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (markdownEnding(code)) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenInfo(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (markdownSpace(code)) {
      effects.exit('fencedCodeFenceInfo')
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenInfoAfter(code)
    }

    if (markdownEnding(code)) {
      effects.exit('fencedCodeFenceInfo')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenInfo
  }

  function sequenceOpenInfoAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return sequenceOpenInfoAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (markdownEnding(code)) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceMeta')
    return sequenceOpenMeta(code)
  }

  function sequenceOpenMeta(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (markdownEnding(code)) {
      effects.exit('fencedCodeFenceMeta')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenMeta
  }

  function openAfter(code) {
    effects.exit('fencedCodeFenceStart')

    if (markdownLineEnding(code)) {
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return next
    }

    return lineEnd(code)
  }

  function lineStart(code) {
    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    if (initialPrefixSize !== 0 && markdownSpace(code)) {
      effects.enter('linePrefix')
      prefixSize = 0
      return linePrefix(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function linePrefix(code) {
    if (prefixSize < initialPrefixSize && markdownSpace(code)) {
      prefixSize++
      effects.consume(code)
      return linePrefix
    }

    effects.exit('linePrefix')
    prefixSize = undefined

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function lineData(code) {
    if (markdownEnding(code)) {
      effects.exit('codeLineData')
      return lineEnd(code)
    }

    effects.consume(code)
    return lineData
  }

  function lineEnd(code) {
    if (code === codes.eof) {
      return after(code)
    }

    assert(
      markdownLineEnding(code),
      'expected only an EOF or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return next
  }

  function next() {
    return effects.createConstructAttempt(closingFence, after, lineStart)
  }

  function after(code) {
    effects.exit('fencedCode')
    return ok(code)
  }

  function tokenizeClosingFence(effects, ok, nok) {
    var size = 0

    return closingStart

    function closingStart(code) {
      if (markdownSpace(code)) {
        effects.enter('linePrefix')
        prefixSize = 0
        return closingPrefix(code)
      }

      return closingPrefixAfter(code)
    }

    function closingPrefix(code) {
      if (markdownSpace(code)) {
        prefixSize++

        // Closing prefix cannot start when indented.
        if (prefixSize >= constants.tabSize) {
          prefixSize = undefined
          return nok(code)
        }

        effects.consume(code)
        return closingPrefix
      }

      prefixSize = undefined
      effects.exit('linePrefix')
      return closingPrefixAfter(code)
    }

    function closingPrefixAfter(code) {
      if (code === marker) {
        effects.enter('fencedCodeFenceEnd')
        effects.enter('fencedCodeFenceSequence')
        return closingSequence(code)
      }

      return nok(code)
    }

    function closingSequence(code) {
      if (code === marker) {
        size++
        effects.consume(code)
        return closingSequence
      }

      if (size < sizeOpen) {
        return nok(code)
      }

      effects.exit('fencedCodeFenceSequence')

      if (markdownSpace(code)) {
        effects.enter('fencedCodeFenceWhitespace')
        return closingSequenceAfter(code)
      }

      return closingSequenceEnd(code)
    }

    function closingSequenceAfter(code) {
      if (markdownSpace(code)) {
        effects.consume(code)
        return closingSequenceAfter
      }

      effects.exit('fencedCodeFenceWhitespace')
      return closingSequenceEnd(code)
    }

    function closingSequenceEnd(code) {
      if (markdownEnding(code)) {
        effects.exit('fencedCodeFenceEnd')
        return ok(code)
      }

      return nok(code)
    }
  }
}
