exports.tokenize = tokenizeDefinition
exports.resolve = resolveDefinitions

var asciiControl = require('../../character/ascii-control')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../../character/markdown-line-ending-or-space')
var markdownEnding = require('../../character/markdown-ending')
var markdownEndingOrSpace = require('../../character/markdown-ending-or-space')
var markdownSpace = require('../../character/markdown-space')
var codes = require('../../character/codes')
var core = require('../../core')
var tokenizeEvent = require('../../util/tokenize-event')

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
      if (token.type === 'definitionLabelData') {
        labelDataIndex = index
      }

      if (token.type === 'definitionDestinationData') {
        destinationDataIndex = index
      }

      if (token.type === 'definitionTitleData') {
        titleDataIndex = index
      }
    }
  }

  result = result.concat(
    events.slice(0, labelDataIndex + 1),
    tokenizeEvent(events[labelDataIndex], core.plainText)
  )

  if (destinationDataIndex === undefined) {
    return result.concat(events.slice(labelDataIndex + 1))
  }

  result = result.concat(
    events.slice(labelDataIndex + 1, destinationDataIndex + 1),
    tokenizeEvent(events[destinationDataIndex], core.plainText)
  )

  if (titleDataIndex === undefined) {
    return result.concat(events.slice(destinationDataIndex + 1))
  }

  result = result.concat(
    events.slice(destinationDataIndex + 1, titleDataIndex + 1),
    tokenizeEvent(events[titleDataIndex], core.plainText)
  )

  return result.concat(events.slice(titleDataIndex + 1))
}

function tokenizeDefinition(effects, ok, nok) {
  var label = false
  var balance = 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter('definition')
    effects.enter('definitionLabel')
    effects.enter('definitionLabelMarker')
    effects.consume(code)
    effects.exit('definitionLabelMarker')
    return labelBreak
  }

  function labelBreak(code) {
    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      if (label === false) {
        return nok(code)
      }

      effects.enter('definitionLabelMarker')
      effects.consume(code)
      effects.exit('definitionLabelMarker')
      effects.exit('definitionLabel')
      return labelAfter
    }

    effects.enter('definitionLabelData')
    return labelData(code)
  }

  function labelData(code) {
    if (code === codes.leftSquareBracket || code === codes.rightSquareBracket) {
      effects.exit('definitionLabelData')
      return labelBreak(code)
    }

    if (label === false && !markdownLineEndingOrSpace(code)) {
      label = true
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
      effects.consume(code)
      return destinationBefore
    }

    return nok(code)
  }

  function destinationBefore(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return destinationBefore
    }

    if (markdownSpace(code)) {
      effects.enter('whitespace')
      effects.consume(code)
      return destinationBeforeWhitespace
    }

    if (code === codes.lessThan) {
      effects.enter('definitionDestination')
      effects.enter('definitionDestinationQuoted')
      effects.enter('definitionDestinationMarker')
      effects.consume(code)
      effects.exit('definitionDestinationMarker')
      return destinationQuotedBefore
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    effects.enter('definitionDestination')
    effects.enter('definitionDestinationUnquoted')
    effects.enter('definitionDestinationData')
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

    effects.exit('whitespace')
    return destinationBefore(code)
  }

  function destinationQuotedBefore(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.enter('definitionDestinationMarker')
      effects.consume(code)
      effects.exit('definitionDestinationMarker')
      effects.exit('definitionDestinationQuoted')
      effects.exit('definitionDestination')
      return destinationAfter
    }

    effects.enter('definitionDestinationData')
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
      effects.exit('definitionDestinationData')
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
      if (balance !== 0) {
        return nok(code)
      }

      effects.exit('definitionDestinationData')
      effects.exit('definitionDestinationUnquoted')
      effects.exit('definitionDestination')
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
      if (balance === 0) {
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
      effects.exit('definition')
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.enter('whitespace')
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

    effects.exit('whitespace')
    return after(code)
  }
}

function tokenizeTitle(effects, ok, nok) {
  var marker
  var tokenType

  return start

  function start(code) {
    if (markdownEndingOrSpace(code)) {
      return before(code)
    }

    return nok(code)
  }

  function before(code) {
    if (markdownLineEnding(code)) {
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return before
    }

    if (markdownSpace(code)) {
      effects.enter('whitespace')
      effects.consume(code)
      return whitespaceBefore
    }

    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      marker = code === codes.leftParenthesis ? codes.rightParenthesis : code
      tokenType =
        code === codes.quotationMark
          ? 'definitionTitleDoubleQuoted'
          : code === codes.apostrophe
          ? 'definitionTitleSingleQuoted'
          : 'definitionTitleParenQuoted'

      effects.enter('definitionTitle')
      effects.enter(tokenType)
      effects.enter('definitionTitleMarker')
      effects.consume(code)
      effects.exit('definitionTitleMarker')
      return dataStart
    }

    return nok(code)
  }

  function whitespaceBefore(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return whitespaceBefore
    }

    effects.exit('whitespace')
    return before(code)
  }

  function dataStart(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.enter('definitionTitleMarker')
      effects.consume(code)
      effects.exit('definitionTitleMarker')
      effects.exit(tokenType)
      effects.exit('definitionTitle')
      return after
    }

    effects.enter('definitionTitleData')
    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function data(code) {
    if (code === codes.eof || code === marker) {
      effects.exit('definitionTitleData')
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
      effects.enter('whitespace')
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

    effects.exit('whitespace')
    return after(code)
  }
}
