exports.tokenize = tokenizeSetextHeading
exports.resolve = resolveSetextHeading

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var tokenizeEvent = require('../../util/tokenize-event')
var core = require('../../core')

var closingSequence = {tokenize: tokenizeClosingSequence}

function resolveSetextHeading(events) {
  var index = events.length - 1
  var event
  var content
  var head
  var tail

  while (index) {
    event = events[index]

    if (event[0] === 'exit' && event[1].type === 'setextHeadingContent') {
      break
    }

    index--
  }

  head = events[1]
  tail = events[index]

  content = {
    type: 'setextHeadingContent',
    start: head[1].start,
    end: tail[1].end
  }

  return [].concat(
    [events[0], ['enter', content, head[2]]],
    tokenizeEvent([undefined, content, head[2]], core.text),
    [['exit', content, tail[2]]],
    events.slice(index + 1)
  )
}

function tokenizeSetextHeading(effects, ok, nok) {
  return start

  function start(code) {
    effects.enter('setextHeading')
    return contentStart(code)
  }

  function contentStart(code) {
    assert(!markdownEnding(code), 'expected anything other than EOF, EOL')
    effects.enter('setextHeadingContent')
    effects.consume(code)
    return contentData
  }

  function contentData(code) {
    if (markdownEnding(code)) {
      effects.exit('setextHeadingContent')
      return contentLineEnd(code)
    }

    effects.consume(code)
    return contentData
  }

  function contentLineEnd(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    assert(markdownLineEnding(code), 'expected an EOF or EOL for this state')

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return effects.createConstructAttempt(
      closingSequence,
      afterClosingSequence,
      contentStart
    )
  }

  function afterClosingSequence(code) {
    assert(markdownEnding(code), 'expected an EOF or EOL for this state')

    effects.exit('setextHeading')
    return ok(code)
  }
}

function tokenizeClosingSequence(effects, ok, nok) {
  var marker
  var prefixSize

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
    if (code === codes.dash || code === codes.equalsTo) {
      marker = code
      effects.enter('setextHeadingLine')
      effects.enter('setextHeadingSequence')
      return closingSequence(code)
    }

    return nok(code)
  }

  function closingSequence(code) {
    if (code === marker) {
      effects.consume(code)
      return closingSequence
    }

    effects.exit('setextHeadingSequence')

    if (markdownSpace(code)) {
      effects.enter('lineSuffix')
      return closingSequenceAfter(code)
    }

    return closingSequenceEnd(code)
  }

  function closingSequenceAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return closingSequenceAfter
    }

    effects.exit('lineSuffix')
    return closingSequenceEnd(code)
  }

  function closingSequenceEnd(code) {
    if (markdownEnding(code)) {
      effects.exit('setextHeadingLine')
      return ok(code)
    }

    return nok(code)
  }
}
