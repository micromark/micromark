exports.tokenize = tokenizeDefinition
exports.resolve = resolveDefinitions

var asciiControl = require('../character/ascii-control')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownEnding = require('../character/markdown-ending')
var markdownEndingOrSpace = require('../character/markdown-ending-or-space')
var markdownSpace = require('../character/markdown-space')
var codes = require('../character/codes')
var types = require('../constant/types')
var tokenizeEvent = require('../util/tokenize-event')

var title = {tokenize: tokenizeTitle}

function resolveDefinitions(events, context) {
  var length = events.length
  var index = -1
  var result = []
  var event
  var token
  var labelDataIndex
  var destinationDataIndex
  var titleDataIndex

  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter') {
      if (token.type === types.definitionLabelString) {
        labelDataIndex = index
      }

      if (token.type === types.definitionDestinationString) {
        destinationDataIndex = index
      }

      if (token.type === types.definitionTitleString) {
        titleDataIndex = index
      }
    }
  }

  result = result.concat(
    events.slice(0, labelDataIndex + 1),
    tokenizeEvent(events[labelDataIndex], context.parser.string)
  )

  if (!destinationDataIndex) {
    return result.concat(events.slice(labelDataIndex + 1))
  }

  result = result.concat(
    events.slice(labelDataIndex + 1, destinationDataIndex + 1),
    tokenizeEvent(events[destinationDataIndex], context.parser.string)
  )

  if (!titleDataIndex) {
    return result.concat(events.slice(destinationDataIndex + 1))
  }

  result = result.concat(
    events.slice(destinationDataIndex + 1, titleDataIndex + 1),
    tokenizeEvent(events[titleDataIndex], context.parser.string)
  )

  return result.concat(events.slice(titleDataIndex + 1))
}

function tokenizeDefinition(effects, ok, nok) {
  var balance = 0
  var data

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter(types.definition)
    effects.enter(types.definitionLabel)
    effects.enter(types.definitionLabelMarker)
    effects.consume(code)
    effects.exit(types.definitionLabelMarker)
    return labelBreak
  }

  function labelBreak(code) {
    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      if (!data) {
        return nok(code)
      }

      effects.enter(types.definitionLabelMarker)
      effects.consume(code)
      effects.exit(types.definitionLabelMarker)
      effects.exit(types.definitionLabel)
      return labelAfter
    }

    effects.enter(types.definitionLabelString)
    return label(code)
  }

  function label(code) {
    if (code === codes.leftSquareBracket || code === codes.rightSquareBracket) {
      effects.exit(types.definitionLabelString)
      return labelBreak(code)
    }

    effects.consume(code)

    if (!markdownLineEndingOrSpace(code)) {
      data = true
    }

    return code === codes.backslash ? labelEscape : label
  }

  function labelEscape(code) {
    if (
      code === codes.backslash ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      return label
    }

    return label(code)
  }

  function labelAfter(code) {
    if (code === codes.colon) {
      effects.enter(types.definitionMarker)
      effects.consume(code)
      effects.exit(types.definitionMarker)
      return between
    }

    return nok(code)
  }

  function between(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return between
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return betweenWhitespace
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    if (code === codes.lessThan) {
      effects.enter(types.definitionDestination)
      effects.enter(types.definitionDestinationLiteral)
      effects.enter(types.definitionDestinationMarker)
      effects.consume(code)
      effects.exit(types.definitionDestinationMarker)
      return destinationEnclosedBefore
    }

    effects.enter(types.definitionDestination)
    effects.enter(types.definitionDestinationRaw)
    effects.enter(types.definitionDestinationString)
    effects.consume(code)
    return code === codes.backslash ? destinationRawEscape : destinationRaw
  }

  function betweenWhitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return betweenWhitespace
    }

    effects.exit(types.whitespace)
    return between(code)
  }

  function destinationEnclosedBefore(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.enter(types.definitionDestinationMarker)
      effects.consume(code)
      effects.exit(types.definitionDestinationMarker)
      effects.exit(types.definitionDestinationLiteral)
      effects.exit(types.definitionDestination)
      return destinationAfter
    }

    effects.enter(types.definitionDestinationString)
    effects.consume(code)
    return code === codes.backslash
      ? destinationEnclosedEscape
      : destinationEnclosed
  }

  function destinationEnclosed(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.definitionDestinationString)
      return destinationEnclosedBefore(code)
    }

    effects.consume(code)
    return code === codes.backslash
      ? destinationEnclosedEscape
      : destinationEnclosed
  }

  function destinationEnclosedEscape(code) {
    if (
      code === codes.lessThan ||
      code === codes.greaterThan ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationEnclosed
    }

    return destinationEnclosed(code)
  }

  function destinationRaw(code) {
    if (markdownEndingOrSpace(code)) {
      if (balance) {
        return nok(code)
      }

      effects.exit(types.definitionDestinationString)
      effects.exit(types.definitionDestinationRaw)
      effects.exit(types.definitionDestination)
      return destinationAfter(code)
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    if (code === codes.leftParenthesis) {
      effects.consume(code)
      balance++
      return destinationRaw
    }

    if (code === codes.rightParenthesis) {
      if (!balance) {
        return nok(code)
      }

      effects.consume(code)
      balance--
      return destinationRaw
    }

    effects.consume(code)
    return code === codes.backslash ? destinationRawEscape : destinationRaw
  }

  function destinationRawEscape(code) {
    if (
      code === codes.leftParenthesis ||
      code === codes.rightParenthesis ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationRaw
    }

    return destinationRaw(code)
  }

  function destinationAfter() {
    return effects.createConstructAttempt(title, after, after)
  }

  function after(code) {
    if (markdownEnding(code)) {
      effects.exit(types.definition)
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return whitespaceAfter
    }

    return nok(code)
  }

  function whitespaceAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespaceAfter
    }

    effects.exit(types.whitespace)
    return after(code)
  }
}

function tokenizeTitle(effects, ok, nok) {
  var marker

  return start

  function start(code) {
    if (markdownEndingOrSpace(code)) {
      return before(code)
    }

    return nok(code)
  }

  function before(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return before
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return whitespaceBefore
    }

    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      effects.enter(types.definitionTitle)
      effects.enter(types.definitionTitleMarker)
      effects.consume(code)
      effects.exit(types.definitionTitleMarker)
      marker = code === codes.leftParenthesis ? codes.rightParenthesis : code
      return dataStart
    }

    return nok(code)
  }

  function whitespaceBefore(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespaceBefore
    }

    effects.exit(types.whitespace)
    return before(code)
  }

  function dataStart(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.enter(types.definitionTitleMarker)
      effects.consume(code)
      effects.exit(types.definitionTitleMarker)
      effects.exit(types.definitionTitle)
      return after
    }

    effects.enter(types.definitionTitleString)
    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function data(code) {
    if (code === codes.eof || code === marker) {
      effects.exit(types.definitionTitleString)
      return dataStart(code)
    }

    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function escape(code) {
    if (
      code === marker ||
      code === codes.leftParenthesis ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return data
    }

    return data(code)
  }

  function after(code) {
    if (markdownEnding(code)) {
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return whitespaceAfter
    }

    return nok(code)
  }

  function whitespaceAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespaceAfter
    }

    effects.exit(types.whitespace)
    return after(code)
  }
}
