exports.tokenize = tokenizeHtml

var codes = require('../../character/codes')
var markdownLineEndingOrSpace = require('../../character/markdown-line-ending-or-space')
var asciiAlpha = require('../../character/ascii-alpha')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var constants = require('../../constant/constants')
var types = require('../../constant/types')

function tokenizeHtml(effects, ok, nok) {
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
    if (code !== codes.lessThan) return nok(code)

    effects.enter(types.htmlSpan)
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === codes.slash) {
      effects.consume(code)
      return tagCloseStart
    }

    if (code === codes.questionMark) {
      effects.consume(code)
      return instructionInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenInside
    }

    return nok(code)
  }

  function declarationStart(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentOpenInside
    }

    if (code === codes.leftSquareBracket) {
      lookBuffer = constants.cdataOpeningString
      lookIndex = 0
      effects.consume(code)
      return cdataOpenInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return declarationInside
    }

    return nok(code)
  }

  function commentOpenInside(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentInsideStart
    }

    return nok(code)
  }

  function commentInsideStart(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentInsideStartDash
    }

    return commentInside(code)
  }

  function commentInsideStartDash(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    return commentInside(code)
  }

  function commentInside(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentCloseInside
    }

    effects.consume(code)
    return commentInside
  }

  function commentCloseInside(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return commentInside(code)
  }

  function cdataOpenInside(code) {
    if (code === lookBuffer.charCodeAt(lookIndex)) {
      lookIndex++
      effects.consume(code)
      return lookIndex === lookBuffer.length ? cdataInside : cdataOpenInside
    }

    return nok(code)
  }

  function cdataInside(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseInside
    }

    effects.consume(code)
    return cdataInside
  }

  function cdataCloseInside(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside(code)
  }

  function cdataCloseEnd(code) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside(code)
  }

  function declarationInside(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      return end(code)
    }

    effects.consume(code)
    return declarationInside
  }

  function instructionInside(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.questionMark) {
      effects.consume(code)
      return instructionClose
    }

    effects.consume(code)
    return instructionInside
  }

  function instructionClose(code) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    return instructionInside(code)
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok(code)
  }

  function tagCloseInside(code) {
    if (markdownLineEndingOrSpace(code) || code === codes.greaterThan) {
      return tagCloseBetween(code)
    }

    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok(code)
  }

  function tagCloseBetween(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagCloseBetween
    }

    if (code === codes.greaterThan) {
      return end(code)
    }

    return nok(code)
  }

  function tagOpenInside(code) {
    if (
      markdownLineEndingOrSpace(code) ||
      code === codes.slash ||
      code === codes.greaterThan
    ) {
      return tagOpenBetween(code)
    }

    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagOpenInside
    }

    return nok(code)
  }

  function tagOpenBetween(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenBetween
    }

    if (code === codes.slash) {
      effects.consume(code)
      return end
    }

    if (code === codes.greaterThan) {
      return end(code)
    }

    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok(code)
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
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeNameAfter
    }

    if (code === codes.slash) {
      effects.consume(code)
      return end
    }

    if (code === codes.equalsTo) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === codes.greaterThan) {
      return end(code)
    }

    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok(code)
  }

  function tagOpenAttributeValueBefore(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === codes.quotationMark) {
      effects.consume(code)
      return tagOpenDoubleQuotedAttributeValue
    }

    if (code === codes.apostrophe) {
      effects.consume(code)
      return tagOpenSingleQuotedAttributeValue
    }

    if (
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code)
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
  }

  function tagOpenDoubleQuotedAttributeValue(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.quotationMark) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenDoubleQuotedAttributeValue
  }

  function tagOpenSingleQuotedAttributeValue(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.apostrophe) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenSingleQuotedAttributeValue
  }

  function tagOpenQuotedAttributeValueAfter(code) {
    if (
      markdownLineEndingOrSpace(code) ||
      code === codes.greaterThan ||
      code === codes.slash
    ) {
      return tagOpenBetween(code)
    }

    return nok(code)
  }

  function tagOpenUnquotedAttributeValue(code) {
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

    if (markdownLineEndingOrSpace(code) || code === codes.greaterThan) {
      return tagOpenBetween(code)
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
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
