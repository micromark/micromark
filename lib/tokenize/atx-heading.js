exports.tokenize = tokenizeAtxHeading
exports.resolve = resolveAtxHeading

var codes = require('../character/codes')
var markdownEnding = require('../character/markdown-ending')
var markdownEndingOrSpace = require('../character/markdown-ending-or-space')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var tokenizeEvent = require('../util/tokenize-event')

function resolveAtxHeading(events, context) {
  var contentEnd = events.length - 2
  var contentStart = 3
  var content
  var result

  // Prefix whitespace, part of the opening.
  if (
    events[contentStart][0] === 'enter' &&
    events[contentStart][1].type === types.whitespace
  ) {
    contentStart += 2
  }

  // Suffix whitespace, part of the closing.
  if (
    contentEnd - 2 > contentStart &&
    events[contentEnd][0] === 'exit' &&
    events[contentEnd][1].type === types.whitespace
  ) {
    contentEnd -= 2
  }

  if (
    events[contentEnd][0] === 'exit' &&
    events[contentEnd][1].type === types.atxHeadingSequence &&
    (contentStart === contentEnd - 1 ||
      (contentEnd - 4 > contentStart &&
        events[contentEnd - 2][0] === 'exit' &&
        events[contentEnd - 2][1].type === types.whitespace))
  ) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4
  }

  result = events.slice(0, contentStart)

  if (contentEnd > contentStart) {
    content = {
      type: types.atxHeadingText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    }

    result = result.concat(
      [['enter', content, context]],
      tokenizeEvent([undefined, content, context], context.parser.text),
      [['exit', content, context]]
    )
  }

  return result.concat(events.slice(contentEnd + 1))
}

function tokenizeAtxHeading(effects, ok, nok) {
  var size = 0

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.numberSign) {
      return nok(code)
    }

    effects.enter(types.atxHeading)
    effects.enter(types.atxHeadingSequence)
    return fenceOpenInside
  }

  function fenceOpenInside(code) {
    if (markdownEndingOrSpace(code)) {
      effects.exit(types.atxHeadingSequence)
      return headingBreak(code)
    }

    if (
      code === codes.numberSign &&
      size < constants.atxHeadingOpeningFenceSizeMax
    ) {
      effects.consume(code)
      size++
      return fenceOpenInside
    }

    return nok(code)
  }

  function headingBreak(code) {
    if (markdownEnding(code)) {
      effects.exit(types.atxHeading)
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      return whitespace
    }

    if (code === codes.numberSign) {
      effects.enter(types.atxHeadingSequence)
      return sequence
    }

    effects.enter(types.atxHeadingText)
    return data
  }

  function whitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespace
    }

    effects.exit(types.whitespace)
    return headingBreak(code)
  }

  function sequence(code) {
    if (code === codes.numberSign) {
      effects.consume(code)
      return sequence
    }

    effects.exit(types.atxHeadingSequence)
    return headingBreak(code)
  }

  function data(code) {
    if (markdownEndingOrSpace(code) || code === codes.numberSign) {
      effects.exit(types.atxHeadingText)
      return headingBreak(code)
    }

    effects.consume(code)
    return data
  }
}
