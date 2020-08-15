exports.tokenize = tokenizeHtml

var codes = require('../character/codes')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var asciiAlpha = require('../character/ascii-alpha')
var asciiAlphanumeric = require('../character/ascii-alphanumeric')
var constants = require('../constant/constants')
var types = require('../constant/types')

function tokenizeHtml(effects, ok, nok) {
  var marker
  var buffer
  var index

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.lessThan) return nok(code)

    effects.enter(types.htmlSpan)
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code)
      return declarationOpen
    }

    if (code === codes.slash) {
      effects.consume(code)
      return tagCloseStart
    }

    if (code === codes.questionMark) {
      effects.consume(code)
      return instruction
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagOpen
    }

    return nok(code)
  }

  function declarationOpen(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentOpen
    }

    if (code === codes.leftSquareBracket) {
      effects.consume(code)
      buffer = constants.cdataOpeningString
      index = 0
      return cdataOpen
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return declaration
    }

    return nok(code)
  }

  function commentOpen(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentStart
    }

    return nok(code)
  }

  function commentStart(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentStartDash
    }

    return comment(code)
  }

  function commentStartDash(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    return comment(code)
  }

  function comment(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentClose
    }

    effects.consume(code)
    return comment
  }

  function commentClose(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }

  function cdataOpen(code) {
    if (code === buffer.charCodeAt(index++)) {
      effects.consume(code)
      return index === buffer.length ? cdata : cdataOpen
    }

    return nok(code)
  }

  function cdata(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataClose
    }

    effects.consume(code)
    return cdata
  }

  function cdataClose(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataEnd
    }

    return cdata(code)
  }

  function cdataEnd(code) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataEnd
    }

    return cdata(code)
  }

  function declaration(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return end(code)
    }

    effects.consume(code)
    return declaration
  }

  function instruction(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.questionMark) {
      effects.consume(code)
      return instructionClose
    }

    effects.consume(code)
    return instruction
  }

  function instructionClose(code) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    return instruction(code)
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagClose
    }

    return nok(code)
  }

  function tagClose(code) {
    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagClose
    }

    return tagCloseBetween(code)
  }

  function tagCloseBetween(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagCloseBetween
    }

    return end(code)
  }

  function tagOpen(code) {
    if (
      code === codes.slash ||
      code === codes.greaterThan ||
      markdownLineEndingOrSpace(code)
    ) {
      return tagOpenBetween(code)
    }

    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagOpen
    }

    return nok(code)
  }

  function tagOpenBetween(code) {
    if (code === codes.slash) {
      effects.consume(code)
      return end
    }

    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenBetween
    }

    return end(code)
  }

  function tagOpenAttributeName(code) {
    if (
      code === codes.dash ||
      code === codes.dot ||
      code === codes.colon ||
      code === codes.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return tagOpenAttributeNameAfter(code)
  }

  function tagOpenAttributeNameAfter(code) {
    if (code === codes.equalsTo) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeNameAfter
    }

    return tagOpenBetween(code)
  }

  function tagOpenAttributeValueBefore(code) {
    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.consume(code)
      marker = code
      return tagOpenAttributeValueQuoted
    }

    if (
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code)
    }

    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    effects.consume(code)
    marker = undefined
    return tagOpenAttributeValueUnquoted
  }

  function tagOpenAttributeValueQuoted(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.consume(code)
      return tagOpenAttributeValueQuotedAfter
    }

    effects.consume(code)
    return tagOpenAttributeValueQuoted
  }

  function tagOpenAttributeValueQuotedAfter(code) {
    if (
      code === codes.greaterThan ||
      code === codes.slash ||
      markdownLineEndingOrSpace(code)
    ) {
      return tagOpenBetween(code)
    }

    return nok(code)
  }

  function tagOpenAttributeValueUnquoted(code) {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.graveAccent
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code)
    }

    effects.consume(code)
    return tagOpenAttributeValueUnquoted
  }

  function end(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      effects.exit(types.htmlSpan)
      return ok
    }

    return nok(code)
  }
}
