exports.tokenize = tokenizeDefinition
exports.resolve = resolveDefinition

var assert = require('assert')
var asciiControl = require('../character/ascii-control')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var normalizeIdentifier = require('../util/normalize-identifier')
var codes = require('../character/codes')
var types = require('../constant/types')
var createSpaceTokenizer = require('./partial-space')
var spaceOrLineEnding = require('./partial-space-or-line-ending')

var title = {tokenize: tokenizeTitle, partial: true}

function resolveDefinition(events, context) {
  var identifier
  var length = events.length
  var index = -1

  while (++index < length) {
    if (
      events[index][0] === 'enter' &&
      events[index][1].type === types.definitionLabelString
    ) {
      identifier = normalizeIdentifier(context.sliceSerialize(events[index][1]))

      if (context.parser.defined.indexOf(identifier) < 0) {
        context.parser.defined.push(identifier)
      }
    }
  }

  return events
}

function tokenizeDefinition(effects, ok, nok) {
  var self = this
  var atEnd = effects.attempt(createSpaceTokenizer(types.whitespace), after)
  var destinationAfter = effects.attempt(title, atEnd, atEnd)
  var balance = 0
  var size = 0
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
    effects.enter(types.definitionLabelString)
    return atStart
  }

  function atStart(code) {
    /* istanbul ignore next - the footnote plugin turns of definitions when they
     * start with a caret. */
    if (
      '_hiddenFootnoteSupport' in self.parser.constructs &&
      code === codes.caret
    ) {
      return nok(code)
    }

    return atBreak(code)
  }

  function atBreak(code) {
    if (
      code === codes.eof ||
      code === codes.leftSquareBracket ||
      size > constants.linkReferenceSizeMax
    ) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      if (!data) {
        return nok(code)
      }

      effects.exit(types.definitionLabelString)
      effects.enter(types.definitionLabelMarker)
      effects.consume(code)
      effects.exit(types.definitionLabelMarker)
      effects.exit(types.definitionLabel)
      return labelAfter
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      size++
      return atBreak
    }

    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return label(code)
  }

  function label(code) {
    if (
      code === codes.eof ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket ||
      size > constants.linkReferenceSizeMax ||
      markdownLineEnding(code)
    ) {
      effects.exit(types.chunkString)
      return atBreak(code)
    }

    if (!markdownSpace(code)) {
      data = true
    }

    size++
    effects.consume(code)
    return code === codes.backslash ? labelEscape : label
  }

  function labelEscape(code) {
    if (
      code === codes.backslash ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      size++
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
    if (code === codes.lessThan) {
      effects.enter(types.definitionDestination)
      effects.enter(types.definitionDestinationLiteral)
      effects.enter(types.definitionDestinationMarker)
      effects.consume(code)
      effects.exit(types.definitionDestinationMarker)
      return destinationEnclosedBefore
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEndingOrSpace(code)) {
      return effects.attempt(spaceOrLineEnding, between)(code)
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    effects.enter(types.definitionDestination)
    effects.enter(types.definitionDestinationRaw)
    effects.enter(types.definitionDestinationString)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    effects.consume(code)
    return code === codes.backslash ? destinationRawEscape : destinationRaw
  }

  function destinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      effects.enter(types.definitionDestinationMarker)
      effects.consume(code)
      effects.exit(types.definitionDestinationMarker)
      effects.exit(types.definitionDestinationLiteral)
      effects.exit(types.definitionDestination)
      return destinationAfter
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code)
    }

    effects.enter(types.definitionDestinationString)
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    effects.consume(code)
    return code === codes.backslash
      ? destinationEnclosedEscape
      : destinationEnclosed
  }

  function destinationEnclosed(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.chunkString)
      effects.exit(types.definitionDestinationString)
      return destinationEnclosedBefore(code)
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code)
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

    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      if (balance) {
        return nok(code)
      }

      effects.exit(types.chunkString)
      effects.exit(types.definitionDestinationString)
      effects.exit(types.definitionDestinationRaw)
      effects.exit(types.definitionDestination)
      return destinationAfter(code)
    }

    if (asciiControl(code)) {
      return nok(code)
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

  function after(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.definition)
      return ok(code)
    }

    return nok(code)
  }
}

function tokenizeTitle(effects, ok, nok) {
  var marker

  return start

  function start(code) {
    // Note: blank lines can’t exist in content.
    return markdownLineEndingOrSpace(code)
      ? effects.attempt(spaceOrLineEnding, before)(code)
      : nok(code)
  }

  function before(code) {
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
      return atFirstBreak
    }

    return nok(code)
  }

  function atFirstBreak(code) {
    if (code === marker) {
      return atMarker(code)
    }

    effects.enter(types.definitionTitleString)
    return atBreak(code)
  }

  function atBreak(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.exit(types.definitionTitleString)
      return atMarker(marker)
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return atBreak
    }

    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    effects.consume(code)
    return code === codes.backslash ? escape : data
  }

  function data(code) {
    if (code === codes.eof || code === marker || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      return atBreak(code)
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

  function atMarker(code) {
    assert.equal(code, marker, 'expected marker')
    effects.enter(types.definitionTitleMarker)
    effects.consume(code)
    effects.exit(types.definitionTitleMarker)
    effects.exit(types.definitionTitle)
    return effects.attempt(createSpaceTokenizer(types.whitespace), after)
  }

  function after(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
