exports.tokenize = tokenizeAtxHeading
exports.resolve = resolveAtxHeading

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var createSpaceTokenizer = require('./partial-space')

function resolveAtxHeading(events, context) {
  var contentEnd = events.length - 2
  var contentStart = 3
  var content
  var result

  // Prefix whitespace, part of the opening.
  if (events[contentStart][1].type === types.whitespace) {
    contentStart += 2
  }

  // Suffix whitespace, part of the closing.
  if (
    contentEnd - 2 > contentStart &&
    events[contentEnd][1].type === types.whitespace
  ) {
    contentEnd -= 2
  }

  if (
    events[contentEnd][1].type === types.atxHeadingSequence &&
    (contentStart === contentEnd - 1 ||
      (contentEnd - 4 > contentStart &&
        events[contentEnd - 2][1].type === types.whitespace))
  ) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4
  }

  result = events.slice(0, contentStart)

  if (contentEnd > contentStart) {
    content = {
      type: types.atxHeadingText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: constants.contentTypeText
    }

    result = result.concat(
      [['enter', content, context]],
      [['exit', content, context]]
    )
  }

  return result.concat(events.slice(contentEnd + 1))
}

function tokenizeAtxHeading(effects, ok, nok) {
  var interrupt = this.interrupt
  var size = 0

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.numberSign) {
      return nok(code)
    }

    effects.enter(types.atxHeading)
    effects.enter(types.atxHeadingSequence)
    return fenceOpenInside(code)
  }

  function fenceOpenInside(code) {
    if (
      size++ < constants.atxHeadingOpeningFenceSizeMax &&
      code === codes.numberSign
    ) {
      effects.consume(code)
      return fenceOpenInside
    }

    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      effects.exit(types.atxHeadingSequence)
      return interrupt ? ok(code) : headingBreak(code)
    }

    return nok(code)
  }

  function headingBreak(code) {
    if (code === codes.numberSign) {
      effects.enter(types.atxHeadingSequence)
      return sequence(code)
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.atxHeading)
      return ok(code)
    }

    if (markdownSpace(code)) {
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        headingBreak
      )(code)
    }

    effects.enter(types.atxHeadingText)
    return data(code)
  }

  function sequence(code) {
    if (code !== codes.numberSign) {
      effects.exit(types.atxHeadingSequence)
      return headingBreak(code)
    }

    effects.consume(code)
    return sequence
  }

  function data(code) {
    if (
      code === codes.eof ||
      code === codes.numberSign ||
      markdownLineEndingOrSpace(code)
    ) {
      effects.exit(types.atxHeadingText)
      return headingBreak(code)
    }

    effects.consume(code)
    return data
  }
}
