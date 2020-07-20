exports.tokenize = tokenizeHtml
exports.resolveTo = resolveToHtml

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownEndingOrSpace = require('../../character/markdown-ending-or-space')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')
var fromCharCode = require('../../constant/from-char-code')
var basics = require('../../constant/html-block-names')
var raws = require('../../constant/html-raw-names')
var asciiAlpha = require('../../character/ascii-alpha')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var lowercase = require('../../util/lowercase')

var blank = {tokenize: tokenizeBlank}

function resolveToHtml(events) {
  var tailIndex = events.length - 1
  var event

  while (tailIndex !== 0) {
    event = events[tailIndex]

    if (event[0] === 'enter' && event[1].type === 'htmlFlow') {
      break
    }

    tailIndex--
  }

  event = tailIndex - 2 >= 0 ? events[tailIndex - 2] : undefined

  if (
    event !== undefined &&
    event[0] === 'enter' &&
    event[1].type === 'linePrefix'
  ) {
    // Add the prefix start to the HTML token.
    events[tailIndex][1].start = event[1].start
    // Remove the line prefix.
    events.splice(tailIndex - 2, 2)
  }

  return events
}

function tokenizeHtml(effects, ok, nok) {
  var self = this
  var name = ''
  var kind
  var endTag
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.lessThan) {
      return nok(code)
    }

    effects.enter('htmlFlow')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === codes.slash) {
      endTag = true
      effects.consume(code)
      return tagCloseStart
    }

    if (code === codes.questionMark) {
      kind = constants.kindHtmlInstruction
      effects.consume(code)
      // While we’re in an instruction instead of a declaration, we’re on a `?`
      // right now, so we do need to search for `>`, similar to declarations.
      return continuationDeclarationInside
    }

    if (asciiAlpha(code)) {
      endTag = false
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function declarationStart(code) {
    if (code === codes.dash) {
      kind = constants.kindHtmlComment
      effects.consume(code)
      return commentOpenInside
    }

    if (code === codes.leftSquareBracket) {
      kind = constants.kindHtmlCdata
      lookBuffer = constants.cdataOpeningString
      lookIndex = 0
      effects.consume(code)
      return cdataOpenInside
    }

    if (asciiAlpha(code)) {
      kind = constants.kindHtmlDeclaration
      effects.consume(code)
      return continuationDeclarationInside
    }

    return nok(code)
  }

  function commentOpenInside(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return nok(code)
  }

  function cdataOpenInside(code) {
    if (code === lookBuffer.charCodeAt(lookIndex)) {
      lookIndex++
      effects.consume(code)
      return lookIndex === lookBuffer.length ? continuation : cdataOpenInside
    }

    return nok(code)
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function tagName(code) {
    var selfClosing = code === codes.slash
    var raw
    var basic

    if (
      markdownEndingOrSpace(code) ||
      code === codes.greaterThan ||
      selfClosing === true
    ) {
      raw = raws.indexOf(name) !== -1
      basic = basics.indexOf(name) !== -1

      if (raw && endTag === false && selfClosing === false) {
        kind = constants.kindHtmlRaw
        return continuation
      }

      if (basic) {
        kind = constants.kindHtmlBasic

        if (selfClosing === true) {
          effects.consume(code)
          return basicSelfClosing
        }

        return continuation
      }

      // Do not support complete HTML when interrupting.
      if (self.check) {
        return nok(code)
      }

      kind = constants.kindHtmlComplete
      return completeAttributeNameBefore
    }

    if (code === codes.dash || asciiAlphanumeric(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function basicSelfClosing(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      return continuation
    }

    return nok(code)
  }

  function completeAttributeNameBefore(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeNameBefore
    }

    if (endTag === false) {
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

    return completeAttributeNameAfter
  }

  function completeAttributeNameAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeNameAfter
    }

    if (code === codes.equalsTo) {
      effects.consume(code)
      return completeAttributeValueBefore
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

    if (markdownSpace(code)) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    if (code === codes.quotationMark) {
      effects.consume(code)
      return completeAttributeValueDoubleQuoted
    }

    if (code === codes.apostrophe) {
      effects.consume(code)
      return completeAttributeValueSingleQuoted
    }

    return completeAttributeValueUnquoted
  }

  function completeAttributeValueDoubleQuoted(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.quotationMark) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueDoubleQuoted
  }

  function completeAttributeValueSingleQuoted(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    if (code === codes.apostrophe) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueSingleQuoted
  }

  function completeAttributeValueUnquoted(code) {
    if (
      markdownEndingOrSpace(code) ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return completeAttributeNameAfter(code)
    }

    effects.consume(code)
    return completeAttributeValueUnquoted
  }

  function completeAttributeAfterQuotedValue(code) {
    if (
      markdownSpace(code) ||
      code === codes.slash ||
      code === codes.greaterThan
    ) {
      return completeAttributeNameBefore
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
    if (markdownEndingOrSpace(code)) {
      return continuation(code)
    }

    return nok(code)
  }

  function continuation(code) {
    if (code === codes.eof) {
      effects.exit('htmlFlow')
      return ok(code)
    }

    if (kind === constants.kindHtmlRaw && code === codes.lessThan) {
      effects.consume(code)
      return continuationRawTagOpen
    }

    if (kind === constants.kindHtmlComment && code === codes.dash) {
      effects.consume(code)
      return continuationCommentInside
    }

    if (kind === constants.kindHtmlInstruction && code === codes.questionMark) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    if (kind === constants.kindHtmlDeclaration && code === codes.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    if (kind === constants.kindHtmlCdata && code === codes.rightSquareBracket) {
      effects.consume(code)
      return continuationCharacterDataInside
    }

    if (
      (kind === constants.kindHtmlBasic ||
        kind === constants.kindHtmlComplete) &&
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
      name = ''
      effects.consume(code)
      return continuationRawEndTag
    }

    return continuation(code)
  }

  // Note: This state can be optimized by either imposing a maximum size (the
  // size of the longest possible raw tag name) or by using a trie of the
  // possible raw tag names.
  function continuationRawEndTag(code) {
    if (code === codes.greaterThan && raws.indexOf(name) !== -1) {
      effects.consume(code)
      return continuationClose
    }

    if (asciiAlpha(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return continuationRawEndTag
    }

    return continuation
  }

  function continuationCharacterDataInside(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation
  }

  function continuationDeclarationInside(code) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    return continuation
  }

  function continuationClose(code) {
    if (markdownEnding(code)) {
      effects.exit('htmlFlow')
      return ok(code)
    }

    effects.consume(code)
    return continuationClose
  }

  function notBlank(code) {
    assert(markdownLineEnding(code), 'expected an EOL for this state')

    effects.consume(code)
    return continuation
  }
}

function tokenizeBlank(effects, ok, nok) {
  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected an EOL for this state')

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
