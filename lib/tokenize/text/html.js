exports.tokenize = tokenizeHtml

var characters = require('../../util/characters')
var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')

var cdataOpen = 'CDATA['

function tokenizeHtml(effects, ok, nok) {
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.lessThan) return nok(code)

    effects.enter('html')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === characters.exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === characters.slash) {
      effects.consume(code)
      return tagCloseStart
    }

    if (code === characters.questionMark) {
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
    if (code === characters.dash) {
      effects.consume(code)
      return commentOpenInside
    }

    if (code === characters.leftSquareBracket) {
      lookBuffer = cdataOpen
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
    if (code === characters.dash) {
      effects.consume(code)
      return commentInsideStart
    }

    return nok(code)
  }

  function commentInsideStart(code) {
    if (code === characters.eof || code === characters.greaterThan) {
      return nok(code)
    }

    if (code === characters.dash) {
      effects.consume(code)
      return commentInsideStartDash
    }

    return commentInside
  }

  function commentInsideStartDash(code) {
    if (code === characters.eof || code === characters.greaterThan) {
      return nok(code)
    }

    return commentInside
  }

  function commentInside(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.dash) {
      effects.consume(code)
      return commentCloseInside
    }

    effects.consume(code)
    return commentInside
  }

  function commentCloseInside(code) {
    if (code === characters.dash) {
      effects.consume(code)
      return end
    }

    return commentInside
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
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseInside
    }

    effects.consume(code)
    return cdataInside
  }

  function cdataCloseInside(code) {
    if (code === characters.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside
  }

  function cdataCloseEnd(code) {
    if (code === characters.greaterThan) {
      return end
    }

    if (code === characters.rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside
  }

  function declarationInside(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.greaterThan) {
      return end
    }

    effects.consume(code)
    return declarationInside
  }

  function instructionInside(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.questionMark) {
      effects.consume(code)
      return instructionClose
    }

    effects.consume(code)
    return instructionInside
  }

  function instructionClose(code) {
    if (code === characters.greaterThan) {
      return end
    }

    return instructionInside
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok(code)
  }

  function tagCloseInside(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space ||
      code === characters.greaterThan
    ) {
      return tagCloseBetween
    }

    if (code === characters.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok(code)
  }

  function tagCloseBetween(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space
    ) {
      effects.consume(code)
      return tagCloseBetween
    }

    if (code === characters.greaterThan) {
      return end
    }

    return nok(code)
  }

  function tagOpenInside(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space ||
      code === characters.slash ||
      code === characters.greaterThan
    ) {
      return tagOpenBetween
    }

    if (code === characters.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagOpenInside
    }

    return nok(code)
  }

  function tagOpenBetween(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space
    ) {
      effects.consume(code)
      return tagOpenBetween
    }

    if (code === characters.slash) {
      effects.consume(code)
      return end
    }

    if (code === characters.greaterThan) {
      return end
    }

    if (
      code === characters.colon ||
      code === characters.underscore ||
      asciiAlpha(code)
    ) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok(code)
  }

  function tagOpenAttributeName(code) {
    if (
      code === characters.dash ||
      code === characters.dot ||
      code === characters.colon ||
      code === characters.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return tagOpenAttributeNameAfter
  }

  function tagOpenAttributeNameAfter(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space
    ) {
      effects.consume(code)
      return tagOpenAttributeNameAfter
    }

    if (code === characters.slash) {
      effects.consume(code)
      return end
    }

    if (code === characters.equalsTo) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === characters.greaterThan) {
      return end
    }

    if (
      code === characters.colon ||
      code === characters.underscore ||
      asciiAlpha(code)
    ) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok(code)
  }

  function tagOpenAttributeValueBefore(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space
    ) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === characters.quotationMark) {
      effects.consume(code)
      return tagOpenDoubleQuotedAttributeValue
    }

    if (code === characters.apostrophe) {
      effects.consume(code)
      return tagOpenSingleQuotedAttributeValue
    }

    if (
      code === characters.lessThan ||
      code === characters.equalsTo ||
      code === characters.greaterThan ||
      code === characters.graveAccent
    ) {
      return nok(code)
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
  }

  function tagOpenDoubleQuotedAttributeValue(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.quotationMark) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenDoubleQuotedAttributeValue
  }

  function tagOpenSingleQuotedAttributeValue(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.apostrophe) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenSingleQuotedAttributeValue
  }

  function tagOpenQuotedAttributeValueAfter(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space ||
      code === characters.greaterThan ||
      code === characters.slash
    ) {
      return tagOpenBetween
    }

    return nok(code)
  }

  function tagOpenUnquotedAttributeValue(code) {
    if (
      code === characters.eof ||
      code === characters.quotationMark ||
      code === characters.apostrophe ||
      code === characters.lessThan ||
      code === characters.equalsTo ||
      code === characters.graveAccent
    ) {
      return nok(code)
    }

    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.tab ||
      code === characters.space ||
      code === characters.greaterThan
    ) {
      return tagOpenBetween
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
  }

  function end(code) {
    if (code === characters.greaterThan) {
      effects.consume(code)
      effects.exit('html')
      return ok(code)
    }

    return nok(code)
  }
}
