exports.tokenize = whitespace
exports.resolve = resolveWhitespace

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var clone = require('../../util/clone-point')

function resolveWhitespace(events) {
  var head = events[0][1]
  var lineEnding = events.length > 2 ? events[2][1] : undefined
  var hardBreak
  var result = events

  if (head.type === 'whitespace') {
    if (
      head.size >= constants.minHardBreakSize &&
      head.spaceOnly === true &&
      lineEnding &&
      lineEnding.type === 'lineEnding'
    ) {
      hardBreak = {
        type: 'hardBreakTrailing',
        start: clone(head.start),
        end: clone(lineEnding.end)
      }

      result = [].concat(
        [['enter', hardBreak, events[0][2]]],
        events.slice(0, 2),
        [['exit', hardBreak, events[0][2]]],
        events.slice(2)
      )
    } else {
      head.type = 'lineSuffix'
    }
  }

  return result
}

function whitespace(effects, ok) {
  var whitespaceToken

  return start

  function start(code) {
    if (markdownSpace(code)) {
      whitespaceToken = effects.enter('whitespace')
      whitespaceToken.size = 1
      whitespaceToken.spaceOnly = code !== codes.ht

      effects.consume(code)
      return whitespace
    }

    assert(
      markdownLineEnding(code),
      'expected whitespace or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return atBreak
  }

  function whitespace(code) {
    if (code === codes.eof) {
      effects.exit('whitespace')
      return ok(code)
    }

    if (markdownSpace(code)) {
      whitespaceToken.size++

      if (code === codes.ht) {
        whitespaceToken.spaceOnly = false
      }

      effects.consume(code)
      return whitespace
    }

    if (markdownLineEnding(code)) {
      effects.exit('whitespace')
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return atBreak
    }

    // Mark as normal data.
    whitespaceToken.type = 'data'
    effects.exit('data')
    return ok(code)
  }

  function atBreak(code) {
    if (markdownSpace(code)) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefix
    }

    return ok(code)
  }

  function prefix(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return prefix
    }

    effects.exit('linePrefix')
    return ok(code)
  }
}
