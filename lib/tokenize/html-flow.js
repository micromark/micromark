exports.tokenize = tokenizeHtml
exports.resolveTo = resolveToHtml

var assert = require('assert')
var asciiAlpha = require('../character/ascii-alpha')
var asciiAlphanumeric = require('../character/ascii-alphanumeric')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
var markdownEndingOrSpace = require('../character/markdown-ending-or-space')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var fromCharCode = require('../constant/from-char-code')
var basics = require('../constant/html-block-names')
var raws = require('../constant/html-raw-names')
var types = require('../constant/types')
var lowercase = require('../util/lowercase')

var blank = {tokenize: tokenizeBlank}

function resolveToHtml(events) {
  var index = events.length

  while (index--) {
    if (
      events[index][0] === 'enter' &&
      events[index][1].type === types.htmlFlow
    ) {
      break
    }
  }

  if (index > 1 && events[index - 2][1].type === types.linePrefix) {
    // Add the prefix start to the HTML token.
    events[index][1].start = events[index - 2][1].start
    // Remove the line prefix.
    events.splice(index - 2, 2)
  }

  return events
}

function tokenizeHtml(effects, ok, nok) {
  var interrupt = this.check
  var kind
  var startTag
  var buffer
  var index
  var marker

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.lessThan) {
      return nok(code)
    }

    effects.enter(types.htmlFlow)
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
      kind = constants.htmlInstruction
      effects.consume(code)
      // While we’re in an instruction instead of a declaration, we’re on a `?`
      // right now, so we do need to search for `>`, similar to declarations.
      return interrupt ? ok : continuationDeclarationInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      buffer = fromCharCode(lowercase(code))
      startTag = true
      return tagName
    }

    return nok(code)
  }

  function declarationStart(code) {
    if (code === codes.dash) {
      effects.consume(code)
      kind = constants.htmlComment
      return commentOpenInside
    }

    if (code === codes.leftSquareBracket) {
      effects.consume(code)
      kind = constants.htmlCdata
      buffer = constants.cdataOpeningString
      index = 0
      return cdataOpenInside
    }

    if (asciiAlpha(code)) {
      effects.consume(code)
      kind = constants.htmlDeclaration
      return interrupt ? ok : continuationDeclarationInside
    }

    return nok(code)
  }

  function commentOpenInside(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return interrupt ? ok : continuationDeclarationInside
    }

    return nok(code)
  }

  function cdataOpenInside(code) {
    if (code === buffer.charCodeAt(index++)) {
      effects.consume(code)
      return index === buffer.length
        ? interrupt
          ? ok
          : continuation
        : cdataOpenInside
    }

    return nok(code)
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      buffer = fromCharCode(lowercase(code))
      return tagName
    }

    return nok(code)
  }

  function tagName(code) {
    var raw
    var basic

    if (
      code === codes.greaterThan ||
      code === codes.slash ||
      markdownEndingOrSpace(code)
    ) {
      raw = raws.indexOf(buffer) > -1
      basic = basics.indexOf(buffer) > -1

      if (code !== codes.slash && raw && startTag) {
        kind = constants.htmlRaw
        return interrupt ? ok(code) : continuation(code)
      }

      if (basic) {
        kind = constants.htmlBasic

        if (code === codes.slash) {
          effects.consume(code)
          return basicSelfClosing
        }

        return interrupt ? ok(code) : continuation(code)
      }

      // Do not support complete HTML when interrupting.
      if (interrupt) {
        return nok(code)
      }

      kind = constants.htmlComplete
      return completeAttributeNameBefore(code)
    }

    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      buffer += fromCharCode(lowercase(code))
      return tagName
    }

    return nok(code)
  }

  function basicSelfClosing(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      return interrupt ? ok : continuation
    }

    return nok(code)
  }

  function completeAttributeNameBefore(code) {
    if (startTag) {
      if (code === codes.slash) {
        effects.consume(code)
        return completeSelfClosing
      }

      if (
        code === codes.colon ||
        code === codes.underscore ||
        asciiAlpha(code)
      ) {
        effects.consume(code)
        return completeAttributeName
      }
    }

    if (code === codes.greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeNameBefore
    }

    return nok(code)
  }

  function completeAttributeName(code) {
    if (
      code === codes.dash ||
      code === codes.dot ||
      code === codes.colon ||
      code === codes.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return completeAttributeName
    }

    return completeAttributeNameAfter(code)
  }

  function completeAttributeNameAfter(code) {
    if (code === codes.equalsTo) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeNameAfter
    }

    return completeAttributeNameBefore(code)
  }

  function completeAttributeValueBefore(code) {
    if (
      code === codes.eof ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code)
    }

    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.consume(code)
      marker = code
      return completeAttributeValueQuoted
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    marker = undefined
    return completeAttributeValueUnquoted(code)
  }

  function completeAttributeValueQuoted(code) {
    if (code === marker) {
      effects.consume(code)
      return completeAttributeValueQuotedAfter
    }

    if (markdownEnding(code)) {
      return nok(code)
    }

    effects.consume(code)
    return completeAttributeValueQuoted
  }

  function completeAttributeValueUnquoted(code) {
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      markdownEndingOrSpace(code)
    ) {
      return completeAttributeNameAfter(code)
    }

    effects.consume(code)
    return completeAttributeValueUnquoted
  }

  function completeAttributeValueQuotedAfter(code) {
    if (
      code === codes.slash ||
      code === codes.greaterThan ||
      markdownSpace(code)
    ) {
      return completeAttributeNameBefore(code)
    }

    return nok(code)
  }

  function completeSelfClosing(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    return nok(code)
  }

  function completeAfter(code) {
    return markdownEndingOrSpace(code) ? continuation(code) : nok(code)
  }

  function continuation(code) {
    if (code === codes.eof) {
      effects.exit(types.htmlFlow)
      return ok(code)
    }

    if (kind === constants.htmlRaw && code === codes.lessThan) {
      effects.consume(code)
      return continuationRawTagOpen
    }

    if (kind === constants.htmlComment && code === codes.dash) {
      effects.consume(code)
      return continuationCommentInside
    }

    if (kind === constants.htmlInstruction && code === codes.questionMark) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    if (kind === constants.htmlDeclaration && code === codes.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    if (kind === constants.htmlCdata && code === codes.rightSquareBracket) {
      effects.consume(code)
      return continuationCharacterDataInside
    }

    if (
      (kind === constants.htmlBasic || kind === constants.htmlComplete) &&
      markdownLineEnding(code)
    ) {
      return effects.isConstruct(blank, continuationClose, notBlank)
    }

    effects.consume(code)
    return continuation
  }

  function continuationCommentInside(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation(code)
  }

  function continuationRawTagOpen(code) {
    if (code === codes.slash) {
      effects.consume(code)
      buffer = ''
      return continuationRawEndTag
    }

    return continuation(code)
  }

  function continuationRawEndTag(code) {
    if (code === codes.greaterThan && raws.indexOf(buffer) > -1) {
      effects.consume(code)
      return continuationClose
    }

    if (buffer.length < constants.htmlRawSizeMax && asciiAlpha(code)) {
      effects.consume(code)
      buffer += fromCharCode(lowercase(code))
      return continuationRawEndTag
    }

    return continuation(code)
  }

  function continuationCharacterDataInside(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation(code)
  }

  function continuationDeclarationInside(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    return continuation(code)
  }

  function continuationClose(code) {
    if (markdownEnding(code)) {
      effects.exit(types.htmlFlow)
      return ok(code)
    }

    effects.consume(code)
    return continuationClose
  }

  function notBlank(code) {
    assert(markdownLineEnding(code), 'expected EOL')
    effects.consume(code)
    return continuation
  }
}

// Note: we don’t need to worry about tokens here, it’s only used for a
// construct check.
function tokenizeBlank(effects, ok, nok) {
  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected EOL')
    effects.consume(code)
    return blank
  }

  function blank(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return blank
    }

    if (markdownEnding(code)) {
      return ok(code)
    }

    return nok(code)
  }
}
