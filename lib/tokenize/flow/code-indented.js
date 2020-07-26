exports.tokenize = tokenizeCodeIndented
exports.resolve = resolveCodeIndented

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var types = require('../../constant/types')

function resolveCodeIndented(events, helpers) {
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
    [['enter', code, helpers]],
    events.slice(0, index + 1),
    [['exit', code, helpers]],
    events.slice(index + 1)
  )
}

function tokenizeCodeIndented(effects, ok, nok) {
  var valid
  var size

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
    if (!markdownSpace(code)) {
      return nok(code)
    }

    return lineStart(code)
  }

  function lineStart(code) {
    if (markdownSpace(code)) {
      size = 0
      effects.enter(types.linePrefix)
      return linePrefix(code)
    }

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    return end(code)
  }

  function linePrefix(code) {
    var prefix = size < constants.tabSize

    // Not enough indent yet.
    if (prefix && markdownSpace(code)) {
      size++
      effects.consume(code)
      return linePrefix
    }

    effects.exit(types.linePrefix)
    size = undefined

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    if (prefix) {
      return end(code)
    }

    effects.enter(types.codeFlowData)
    return content(code)
  }

  function content(code) {
    if (markdownEnding(code)) {
      effects.exit(types.codeFlowData)
      return lineEnd(code)
    }

    // Mark as valid if this is a non-whitespace.
    if (!valid && !markdownSpace(code)) {
      valid = true
    }

    effects.consume(code)
    return content
  }

  function lineEnd(code) {
    if (!valid || code === codes.eof) {
      return end(code)
    }

    assert(markdownLineEnding(code), 'expected EOF or EOL')

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  function end(code) {
    return (valid ? ok : nok)(code)
  }
}
