exports.tokenize = tokenizeHtml

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEndingOrSpace'.
import markdownLineEndingOrSpace from '../character/markdown-line-ending-or-space'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAlpha'.
import asciiAlpha from '../character/ascii-alpha'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAlphanumeric'.
import asciiAlphanumeric from '../character/ascii-alphanumeric'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

function tokenizeHtml(effects: any, ok: any, nok: any) {
  var marker: any
  var buffer: any
  var index: any
  var returnState: any

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.lessThan) return nok(code)

    effects.enter(types.htmlText)
    effects.enter(types.data)
    effects.consume(code)
    return open
  }

  function open(code: any) {
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

  function declarationOpen(code: any) {
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

  function commentOpen(code: any) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentStart
    }

    return nok(code)
  }

  function commentStart(code: any) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentStartDash
    }

    return comment(code)
  }

  function commentStartDash(code: any) {
    if (code === codes.eof || code === codes.greaterThan) {
      return nok(code)
    }

    return comment(code)
  }

  function comment(code: any) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentClose
    }

    if (markdownLineEnding(code)) {
      returnState = comment
      return atLineEnding(code)
    }

    effects.consume(code)
    return comment
  }

  function commentClose(code: any) {
    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }

  function cdataOpen(code: any) {
    if (code === buffer.charCodeAt(index++)) {
      effects.consume(code)
      return index === buffer.length ? cdata : cdataOpen
    }

    return nok(code)
  }

  function cdata(code: any) {
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

  function cdataClose(code: any) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataEnd
    }

    return cdata(code)
  }

  function cdataEnd(code: any) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.consume(code)
      return cdataEnd
    }

    return cdata(code)
  }

  function declaration(code: any) {
    if (code === codes.eof || code === codes.greaterThan) {
      return end(code)
    }

    effects.consume(code)
    return declaration
  }

  function instruction(code: any) {
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

  function instructionClose(code: any) {
    if (code === codes.greaterThan) {
      return end(code)
    }

    return instruction(code)
  }

  function tagCloseStart(code: any) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return tagClose
    }

    return nok(code)
  }

  function tagClose(code: any) {
    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return tagClose
    }

    return tagCloseBetween(code)
  }

  function tagCloseBetween(code: any) {
    if (markdownLineEnding(code)) {
      returnState = tagCloseBetween
      return atLineEnding(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return tagCloseBetween
    }

    return end(code)
  }

  function tagOpen(code: any) {
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

  function tagOpenBetween(code: any) {
    if (code === codes.slash) {
      effects.consume(code)
      return end
    }

    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code)
      return tagOpenAttributeName
    }

    if (markdownLineEnding(code)) {
      returnState = tagOpenBetween
      return atLineEnding(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return tagOpenBetween
    }

    return end(code)
  }

  function tagOpenAttributeName(code: any) {
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

  function tagOpenAttributeNameAfter(code: any) {
    if (code === codes.equalsTo) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeNameAfter
      return atLineEnding(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeNameAfter
    }

    return tagOpenBetween(code)
  }

  function tagOpenAttributeValueBefore(code: any) {
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

    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueBefore
      return atLineEnding(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return tagOpenAttributeValueBefore
    }

    effects.consume(code)
    marker = undefined
    return tagOpenAttributeValueUnquoted
  }

  function tagOpenAttributeValueQuoted(code: any) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.consume(code)
      return tagOpenAttributeValueQuotedAfter
    }

    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueQuoted
      return atLineEnding(code)
    }

    effects.consume(code)
    return tagOpenAttributeValueQuoted
  }

  function tagOpenAttributeValueQuotedAfter(code: any) {
    if (
      code === codes.greaterThan ||
      code === codes.slash ||
      markdownLineEndingOrSpace(code)
    ) {
      return tagOpenBetween(code)
    }

    return nok(code)
  }

  function tagOpenAttributeValueUnquoted(code: any) {
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

  // We can’t have blank lines in content, so no need to worry about empty
  // tokens.
  function atLineEnding(code: any) {
    assert(returnState, 'expected return state')
    assert(markdownLineEnding(code), 'expected eol')
    effects.exit(types.data)
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(
      createSpaceTokenizer(types.linePrefix, constants.tabSize),
      afterPrefix
    )

    function afterPrefix(code: any) {
      effects.enter(types.data)
      return returnState(code)
    }
  }

  function end(code: any) {
    if (code === codes.greaterThan) {
      effects.consume(code)
      effects.exit(types.data)
      effects.exit(types.htmlText)
      return ok
    }

    return nok(code)
  }
}
