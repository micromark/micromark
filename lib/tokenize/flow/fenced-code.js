exports.tokenize = tokenizeFencedCode
exports.resolve = resolveFencedCode

var assert = require('assert')
var core = require('../../core')
var codes = require('../../character/codes')
var constants = require('../../constant/constants')

function resolveFencedCode(events) {
  var index = -1
  var length = events.length
  var infoEnter
  var metaEnter
  var infoEvent
  var metaEvent
  var type
  var event
  var result
  var tokenizer

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
    infoEvent = events[infoEnter]
    tokenizer = core.plainText(infoEvent[1].start)

    result = events
      .slice(0, infoEnter + 1)
      .concat(
        infoEvent[2].sliceStream(infoEvent[1]).concat(null).flatMap(tokenizer)
      )

    if (metaEnter === undefined) {
      result = result.concat(events.slice(infoEnter + 1))
    } else {
      metaEvent = events[metaEnter]
      tokenizer = core.plainText(metaEvent[1].start)

      result = result.concat(
        events.slice(infoEnter + 1, metaEnter + 1),
        metaEvent[2].sliceStream(metaEvent[1]).concat(null).flatMap(tokenizer),
        events.slice(metaEnter + 1)
      )
    }
  }

  return result
}

function tokenizeFencedCode(effects, ok, nok) {
  var closingFence = {tokenize: tokenizeClosingFence}
  var sizeOpen = 0
  var initialPrefixSize
  var prefixSize
  var marker

  return start

  function start(code) {
    var previous

    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.graveAccent && code !== codes.tilde) {
      return nok(code)
    }

    previous = effects.previousToken

    initialPrefixSize =
      previous && previous.type === 'linePrefix'
        ? previous.end.column - previous.start.column
        : 0

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

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      return openAfter(code)
    }

    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenAfter(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.consume(code)
      return sequenceOpenAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenInfo(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.exit('fencedCodeFenceInfo')
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenInfoAfter(code)
    }

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      effects.exit('fencedCodeFenceInfo')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenInfo
  }

  function sequenceOpenInfoAfter(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.consume(code)
      return sequenceOpenInfoAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceMeta')
    return sequenceOpenMeta(code)
  }

  function sequenceOpenMeta(code) {
    if (marker === codes.graveAccent && code === marker) {
      return nok(code)
    }

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      effects.exit('fencedCodeFenceMeta')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenMeta
  }

  function openAfter(code) {
    effects.exit('fencedCodeFenceStart')

    if (code === codes.cr || code === codes.lf || code === codes.crlf) {
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return next
    }

    return lineEnd(code)
  }

  function lineStart(code) {
    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      return lineEnd(code)
    }

    if (
      initialPrefixSize !== 0 &&
      (code === codes.ht || code === codes.vs || code === codes.space)
    ) {
      effects.enter('linePrefix')
      prefixSize = 0
      return linePrefix(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function linePrefix(code) {
    if (
      prefixSize < initialPrefixSize &&
      (code === codes.ht || code === codes.vs || code === codes.space)
    ) {
      prefixSize++
      effects.consume(code)
      return linePrefix
    }

    effects.exit('linePrefix')
    prefixSize = undefined

    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      return lineEnd(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function lineData(code) {
    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
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
      code === codes.cr || code === codes.lf || code === codes.crlf,
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
      if (code === codes.ht || code === codes.vs || code === codes.space) {
        effects.enter('linePrefix')
        prefixSize = 0
        return closingPrefix(code)
      }

      return closingPrefixAfter(code)
    }

    function closingPrefix(code) {
      if (code === codes.ht || code === codes.vs || code === codes.space) {
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

      if (code === codes.ht || code === codes.vs || code === codes.space) {
        effects.enter('fencedCodeFenceWhitespace')
        return closingSequenceAfter(code)
      }

      return closingSequenceEnd(code)
    }

    function closingSequenceAfter(code) {
      if (code === codes.ht || code === codes.vs || code === codes.space) {
        effects.consume(code)
        return closingSequenceAfter
      }

      effects.exit('fencedCodeFenceWhitespace')
      return closingSequenceEnd(code)
    }

    function closingSequenceEnd(code) {
      if (
        code === codes.eof ||
        code === codes.cr ||
        code === codes.lf ||
        code === codes.crlf
      ) {
        effects.exit('fencedCodeFenceEnd')
        return ok(code)
      }

      return nok(code)
    }
  }
}
