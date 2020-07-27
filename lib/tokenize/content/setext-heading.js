exports.tokenize = tokenizeSetextHeading
exports.resolve = resolveSetextHeading

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var types = require('../../constant/types')
var tokenizeEvent = require('../../util/tokenize-event')
var core = require('../../core')

var closingSequence = {tokenize: tokenizeClosingSequence}

function resolveSetextHeading(events, helpers) {
  var index = events.length - 1
  var event
  var token
  var content

  while (index) {
    event = events[index]
    token = event[1]

    if (event[0] === 'exit' && token.type === types.setextHeadingText) {
      break
    }

    index--
  }

  content = {
    type: types.setextHeadingText,
    start: events[1][1].start,
    end: token.end
  }

  return [].concat(
    [events[0], ['enter', content, helpers]],
    tokenizeEvent([undefined, content, helpers], core.text),
    [['exit', content, helpers]],
    events.slice(index + 1)
  )
}

function tokenizeSetextHeading(effects, ok, nok) {
  return start

  function start(code) {
    effects.enter(types.setextHeading)
    return contentStart(code)
  }

  function contentStart(code) {
    assert(!markdownEnding(code), 'expected non-EOF/EOL')
    effects.enter(types.setextHeadingText)
    effects.consume(code)
    return contentData
  }

  function contentData(code) {
    if (markdownEnding(code)) {
      effects.exit(types.setextHeadingText)
      return contentLineEnd(code)
    }

    effects.consume(code)
    return contentData
  }

  function contentLineEnd(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    assert(markdownLineEnding(code), 'expected EOF/EOL')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.createConstructAttempt(
      closingSequence,
      afterClosingSequence,
      contentStart
    )
  }

  function afterClosingSequence(code) {
    assert(markdownEnding(code), 'expected EOF/EOL')
    effects.exit(types.setextHeading)
    return ok(code)
  }
}

function tokenizeClosingSequence(effects, ok, nok) {
  var marker
  var prefixSize

  return closingStart

  function closingStart(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      prefixSize = 0
      return closingPrefix(code)
    }

    return closingPrefixAfter(code)
  }

  function closingPrefix(code) {
    if (markdownSpace(code)) {
      prefixSize++

      if (prefixSize < constants.tabSize) {
        effects.consume(code)
        return closingPrefix
      }
    }

    effects.exit(types.linePrefix)
    prefixSize = undefined
    return closingPrefixAfter(code)
  }

  function closingPrefixAfter(code) {
    if (code === codes.dash || code === codes.equalsTo) {
      marker = code
      effects.enter(types.setextHeadingLine)
      effects.enter(types.setextHeadingLineSequence)
      return closingSequence(code)
    }

    return nok(code)
  }

  function closingSequence(code) {
    if (code === marker) {
      effects.consume(code)
      return closingSequence
    }

    effects.exit(types.setextHeadingLineSequence)

    if (markdownSpace(code)) {
      effects.enter(types.lineSuffix)
      return closingSequenceAfter(code)
    }

    return closingSequenceEnd(code)
  }

  function closingSequenceAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return closingSequenceAfter
    }

    effects.exit(types.lineSuffix)
    return closingSequenceEnd(code)
  }

  function closingSequenceEnd(code) {
    if (markdownEnding(code)) {
      effects.exit(types.setextHeadingLine)
      return ok(code)
    }

    return nok(code)
  }
}
