exports.tokenize = tokenizeCodeIndented
exports.resolve = resolveCodeIndented

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var prefixSize = require('../util/prefix-size')
var createSpaceTokenizer = require('./partial-space')

var continuedIndent = {tokenize: tokenizeContinuedIndent, partial: true}

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
  var self = this
  var data

  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return lineEnd(code)
    }

    if (prefixSize(self.events) < constants.tabSize) {
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
    if (!data || code === codes.eof) {
      return end(code)
    }

    return effects.check(continuedIndent, continued, end)(code)
  }

  function continued(code) {
    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(
      createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
      afterPrefix
    )
  }

  function end(code) {
    return (data ? ok : nok)(code)
  }
}

function tokenizeContinuedIndent(effects, ok, nok) {
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(
        createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
        afterPrefix
      )
    }

    return prefixSize(self.events) < constants.tabSize ? nok(code) : ok(code)
  }
}
