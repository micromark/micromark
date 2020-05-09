var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')

exports.tokenize = tokenizeHtml

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32
var exclamationMark = 33 // '!'
var quotationMark = 34 // '"'
var apostrophe = 39 // '''
var dash = 45 // '-'
var dot = 46 // '.'
var slash = 47 // '/'
var colon = 58 // ':'
var lessThan = 60 // '<'
var equalsTo = 61 // '='
var greaterThan = 62 // '>'
var questionMark = 63 // '?'
var leftSquareBracket = 91 // '['
var rightSquareBracket = 93 // ']'
var underscore = 95 // '_'
var graveAccent = 96 // '`'

var cdataOpen = 'CDATA['

function tokenizeHtml(effects, ok, nok) {
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== lessThan) return nok

    effects.enter('html')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === slash) {
      effects.consume(code)
      return tagCloseStart
    }

    if (code === questionMark) {
      effects.consume(code)
      return instructionInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenInside
    }

    return nok
  }

  function declarationStart(code) {
    if (code === dash) {
      effects.consume(code)
      return commentOpenInside
    }

    if (code === leftSquareBracket) {
      lookBuffer = cdataOpen
      lookIndex = 0
      effects.consume(code)
      return cdataOpenInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      return declarationInside
    }

    return nok
  }

  function commentOpenInside(code) {
    if (code === dash) {
      effects.consume(code)
      return commentInsideStart
    }

    return nok
  }

  function commentInsideStart(code) {
    if (code !== code || code === greaterThan) {
      return nok
    }

    if (code === dash) {
      effects.consume(code)
      return commentInsideStartDash
    }

    return commentInside
  }

  function commentInsideStartDash(code) {
    if (code !== code || code === greaterThan) {
      return nok
    }

    return commentInside
  }

  function commentInside(code) {
    if (code !== code) {
      return nok
    }

    if (code === dash) {
      effects.consume(code)
      return commentCloseInside
    }

    effects.consume(code)
    return commentInside
  }

  function commentCloseInside(code) {
    if (code === dash) {
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

    return nok
  }

  function cdataInside(code) {
    if (code !== code) {
      return nok
    }

    if (code === rightSquareBracket) {
      effects.consume(code)
      return cdataCloseInside
    }

    effects.consume(code)
    return cdataInside
  }

  function cdataCloseInside(code) {
    if (code === rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside
  }

  function cdataCloseEnd(code) {
    if (code === greaterThan) {
      return end
    }

    if (code === rightSquareBracket) {
      effects.consume(code)
      return cdataCloseEnd
    }

    return cdataInside
  }

  function declarationInside(code) {
    if (code !== code) {
      return nok
    }

    if (code === greaterThan) {
      return end
    }

    effects.consume(code)
    return declarationInside
  }

  function instructionInside(code) {
    if (code !== code) {
      return nok
    }

    if (code === questionMark) {
      effects.consume(code)
      return instructionClose
    }

    effects.consume(code)
    return instructionInside
  }

  function instructionClose(code) {
    if (code === greaterThan) {
      return end
    }

    return instructionInside
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok
  }

  function tagCloseInside(code) {
    if (
      code === tab ||
      code === lineFeed ||
      code === space ||
      code === greaterThan
    ) {
      return tagCloseBetween
    }

    if (code === dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagCloseInside
    }

    return nok
  }

  function tagCloseBetween(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return tagCloseBetween
    }

    if (code === greaterThan) {
      return end
    }

    return nok
  }

  function tagOpenInside(code) {
    if (
      code === tab ||
      code === lineFeed ||
      code === space ||
      code === slash ||
      code === greaterThan
    ) {
      return tagOpenBetween
    }

    if (code === dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagOpenInside
    }

    return nok
  }

  function tagOpenBetween(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return tagOpenBetween
    }

    if (code === slash) {
      effects.consume(code)
      return end
    }

    if (code === greaterThan) {
      return end
    }

    if (code === colon || code === underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok
  }

  function tagOpenAttributeName(code) {
    if (
      code === dash ||
      code === dot ||
      code === colon ||
      code === underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return tagOpenAttributeNameAfter
  }

  function tagOpenAttributeNameAfter(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return tagOpenAttributeNameAfter
    }

    if (code === slash) {
      effects.consume(code)
      return end
    }

    if (code === equalsTo) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === greaterThan) {
      return end
    }

    if (code === colon || code === underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    return nok
  }

  function tagOpenAttributeValueBefore(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (code === quotationMark) {
      effects.consume(code)
      return tagOpenDoubleQuotedAttributeValue
    }

    if (code === apostrophe) {
      effects.consume(code)
      return tagOpenSingleQuotedAttributeValue
    }

    if (
      code === lessThan ||
      code === equalsTo ||
      code === greaterThan ||
      code === graveAccent
    ) {
      return nok
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
  }

  function tagOpenDoubleQuotedAttributeValue(code) {
    if (code !== code) {
      return nok
    }

    if (code === quotationMark) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenDoubleQuotedAttributeValue
  }

  function tagOpenSingleQuotedAttributeValue(code) {
    if (code !== code) {
      return nok
    }

    if (code === apostrophe) {
      effects.consume(code)
      return tagOpenQuotedAttributeValueAfter
    }

    effects.consume(code)
    return tagOpenSingleQuotedAttributeValue
  }

  function tagOpenQuotedAttributeValueAfter(code) {
    if (
      code === greaterThan ||
      code === slash ||
      code === tab ||
      code === lineFeed ||
      code === space
    ) {
      return tagOpenBetween
    }

    return nok
  }

  function tagOpenUnquotedAttributeValue(code) {
    if (
      code !== code ||
      code === quotationMark ||
      code === apostrophe ||
      code === lessThan ||
      code === equalsTo ||
      code === graveAccent
    ) {
      return nok
    }

    if (
      code === tab ||
      code === lineFeed ||
      code === space ||
      code === greaterThan
    ) {
      return tagOpenBetween
    }

    effects.consume(code)
    return tagOpenUnquotedAttributeValue
  }

  function end(code) {
    if (code === greaterThan) {
      effects.consume(code)
      effects.exit('html')
      return ok
    }

    return nok
  }
}
