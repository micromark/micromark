exports.tokenize = tokenizeDefinition
exports.resolve = resolveDefinitions

var asciiControl = require('../../character/ascii-control')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../../character/markdown-line-ending-or-space')
var markdownEnding = require('../../character/markdown-ending')
var markdownEndingOrSpace = require('../../character/markdown-ending-or-space')
var markdownSpace = require('../../character/markdown-space')
var codes = require('../../character/codes')
var types = require('../../constant/types')
var tokenizeEvent = require('../../util/tokenize-event')
var core = require('../../core')

var title = {tokenize: tokenizeTitle}

function resolveDefinitions(events) {
  var result = []
  var index = -1
  var length = events.length
  var event
  var token
  var labelDataIndex
  var destinationDataIndex
  var titleDataIndex

  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter') {
      if (token.type === types.definitionLabelData) {
        labelDataIndex = index
      }

      if (token.type === types.definitionDestinationText) {
        destinationDataIndex = index
      }

      if (token.type === types.definitionTitleText) {
        titleDataIndex = index
      }
    }
  }

  result = result.concat(
    events.slice(0, labelDataIndex + 1),
    tokenizeEvent(events[labelDataIndex], core.plainText)
  )

  if (!destinationDataIndex) {
    return result.concat(events.slice(labelDataIndex + 1))
  }

  result = result.concat(
    events.slice(labelDataIndex + 1, destinationDataIndex + 1),
    tokenizeEvent(events[destinationDataIndex], core.plainText)
  )

  if (!titleDataIndex) {
    return result.concat(events.slice(destinationDataIndex + 1))
  }

  result = result.concat(
    events.slice(destinationDataIndex + 1, titleDataIndex + 1),
    tokenizeEvent(events[titleDataIndex], core.plainText)
  )

  return result.concat(events.slice(titleDataIndex + 1))
}

function tokenizeDefinition(effects, ok, nok) {
  var balance = 0
  var content

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
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
      if (!content) {
        return nok(code)
      }

      effects.enter(types.definitionLabelMarker)
      effects.consume(code)
      effects.exit(types.definitionLabelMarker)
      effects.exit(types.definitionLabel)
      return labelAfter
    }

    effects.enter(types.definitionLabelData)
    return labelData(code)
  }

  function labelData(code) {
    if (code === codes.leftSquareBracket || code === codes.rightSquareBracket) {
      effects.exit(types.definitionLabelData)
      return labelBreak(code)
    }

    if (!content && !markdownLineEndingOrSpace(code)) {
      content = true
    }

    effects.consume(code)
    return code === codes.backslash ? labelEscape : labelData
  }

  function labelEscape(code) {
    if (
      code === codes.backslash ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      return labelData
    }

    return labelData(code)
  }

  function labelAfter(code) {
    if (code === codes.colon) {
      effects.enter(types.definitionMarker)
      effects.consume(code)
      effects.exit(types.definitionMarker)
      return destinationBefore
    }

    return nok(code)
  }

  function destinationBefore(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return destinationBefore
    }

    if (markdownSpace(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      return destinationBeforeWhitespace
    }

    if (code === codes.lessThan) {
      effects.enter(types.definitionDestination)
      effects.enter(types.definitionDestinationLiteral)
      effects.enter(types.definitionDestinationMarker)
      effects.consume(code)
      effects.exit(types.definitionDestinationMarker)
      return destinationQuotedBefore
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    effects.enter(types.definitionDestination)
    effects.enter(types.definitionDestinationRaw)
    effects.enter(types.definitionDestinationText)
    effects.consume(code)
    return code === codes.backslash
      ? destinationUnquotedEscape
      : destinationUnquoted
  }

  function destinationBeforeWhitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return destinationBeforeWhitespace
    }

    effects.exit(types.whitespace)
    return destinationBefore(code)
  }

  function destinationQuotedBefore(code) {
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

    effects.enter(types.definitionDestinationText)
    effects.consume(code)
    return code === codes.backslash
      ? destinationQuotedEscape
      : destinationQuoted
  }

  function destinationQuoted(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.definitionDestinationText)
      return destinationQuotedBefore(code)
    }

    effects.consume(code)
    return code === codes.backslash
      ? destinationQuotedEscape
      : destinationQuoted
  }

  function destinationQuotedEscape(code) {
    if (
      code === codes.lessThan ||
      code === codes.greaterThan ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationQuoted
    }

    return destinationQuoted(code)
  }

  function destinationUnquoted(code) {
    if (markdownEndingOrSpace(code)) {
      if (balance) {
        return nok(code)
      }

      effects.exit(types.definitionDestinationText)
      effects.exit(types.definitionDestinationRaw)
      effects.exit(types.definitionDestination)
      return destinationAfter(code)
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    if (code === codes.leftParenthesis) {
      balance++
      effects.consume(code)
      return destinationUnquoted
    }

    if (code === codes.rightParenthesis) {
      if (!balance) {
        return nok(code)
      }

      balance--
      effects.consume(code)
      return destinationUnquoted
    }

    effects.consume(code)
    return code === codes.backslash
      ? destinationUnquotedEscape
      : destinationUnquoted
  }

  function destinationUnquotedEscape(code) {
    if (
      code === codes.leftParenthesis ||
      code === codes.rightParenthesis ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationUnquoted
    }

    return destinationUnquoted(code)
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
  var expectedTitleEndMarker

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
      expectedTitleEndMarker =
        code === codes.leftParenthesis ? codes.rightParenthesis : code
      effects.enter(types.definitionTitle)
      effects.enter(types.definitionTitleMarker)
      effects.consume(code)
      effects.exit(types.definitionTitleMarker)
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

    if (code === expectedTitleEndMarker) {
      effects.enter(types.definitionTitleMarker)
      effects.consume(code)
      effects.exit(types.definitionTitleMarker)
      effects.exit(types.definitionTitle)
      return after
    }

    effects.enter(types.definitionTitleText)
    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function data(code) {
    if (code === codes.eof || code === expectedTitleEndMarker) {
      effects.exit(types.definitionTitleText)
      return dataStart(code)
    }

    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function escape(code) {
    if (
      code === expectedTitleEndMarker ||
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
