exports.tokenize = tokenizeCodeIndented
exports.resolve = resolveCodeIndented

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')

var continuedIndent = {tokenize: tokenizeContinuedIndent}

function resolveCodeIndented(events, context) {
  var index = events.length
  var lastBlankLine
  var token
  var code

  while (index--) {
    token = events[index][1]

    if (token.type === types.lineEnding) {
      lastBlankLine = token
      lastBlankLine.type = types.lineEndingBlank
    } else if (
      token.type !== types.lineEndingBlank &&
      token.type !== types.linePrefix
    ) {
      break
    }
  }

  if (lastBlankLine) {
    lastBlankLine.type = types.lineEnding
  }

  code = {
    type: types.codeIndented,
    start: events[0][1].start,
    end: token.end
  }

  return [].concat(
    [['enter', code, context]],
    events.slice(0, index + 1),
    [['exit', code, context]],
    events.slice(index + 1)
  )
}

function tokenizeCodeIndented(effects, ok, nok) {
  var data
  var size

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (!markdownSpace(code)) {
      return nok(code)
    }

    return lineStart(code)
  }

  function lineStart(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      size = 0
      return linePrefix(code)
    }

    assert(markdownLineEnding(code), 'expected eol')
    return lineEnd(code)
  }

  function linePrefix(code) {
    // Not enough indent yet.
    if (size < constants.tabSize && markdownSpace(code)) {
      effects.consume(code)
      size++
      return linePrefix
    }

    effects.exit(types.linePrefix)

    if (markdownLineEnding(code)) {
      return lineEnd(code)
    }

    if (code === codes.eof || size < constants.tabSize) {
      return end(code)
    }

    effects.enter(types.codeFlowValue)
    return content(code)
  }

  function content(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return lineEnd(code)
    }

    effects.consume(code)

    // Mark as valid if this is a non-whitespace.
    if (!markdownSpace(code)) {
      data = true
    }

    return content
  }

  function lineEnd(code) {
    if (code === codes.eof || !data) {
      return end(code)
    }

    return effects.check(continuedIndent, continued, end)
  }

  function continued(code) {
    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  function end(code) {
    return (data ? ok : nok)(code)
  }
}

function tokenizeContinuedIndent(effects, ok, nok) {
  var size = 0

  return lineStart

  function lineStart(code) {
    if (markdownLineEnding(code)) {
      effects.consume(code)
      size = 0
      return lineStart
    }

    if (size < constants.tabSize && markdownSpace(code)) {
      effects.consume(code)
      size++
      return lineStart
    }

    return size < constants.tabSize ? nok(code) : ok(code)
  }
}
