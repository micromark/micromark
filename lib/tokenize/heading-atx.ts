exports.tokenize = tokenizeAtxHeading
exports.resolve = resolveAtxHeading

import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEndingOrSpace'.
import markdownLineEndingOrSpace from '../character/markdown-line-ending-or-space'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

function resolveAtxHeading(events: any, context: any) {
  var contentEnd = events.length - 2
  var contentStart = 3
  var content
  var text
  var result

  // Prefix whitespace, part of the opening.
  if (events[contentStart][1].type === types.whitespace) {
    contentStart += 2
  }

  // Suffix whitespace, part of the closing.
  if (
    contentEnd - 2 > contentStart &&
    events[contentEnd][1].type === types.whitespace
  ) {
    contentEnd -= 2
  }

  if (
    events[contentEnd][1].type === types.atxHeadingSequence &&
    (contentStart === contentEnd - 1 ||
      (contentEnd - 4 > contentStart &&
        events[contentEnd - 2][1].type === types.whitespace))
  ) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4
  }

  result = events.slice(0, contentStart)

  if (contentEnd > contentStart) {
    content = {
      type: types.atxHeadingText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    }
    text = {
      type: types.chunkText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: constants.contentTypeText
    }

    result = result.concat(
      [['enter', content, context]],
      [['enter', text, context]],
      [['exit', text, context]],
      [['exit', content, context]]
    )
  }

  return result.concat(events.slice(contentEnd + 1))
}

function tokenizeAtxHeading(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var size = 0

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.numberSign) {
      return nok(code)
    }

    effects.enter(types.atxHeading)
    effects.enter(types.atxHeadingSequence)
    return fenceOpenInside(code)
  }

  function fenceOpenInside(code: any) {
    if (
      size++ < constants.atxHeadingOpeningFenceSizeMax &&
      code === codes.numberSign
    ) {
      effects.consume(code)
      return fenceOpenInside
    }

    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      effects.exit(types.atxHeadingSequence)
      return self.interrupt ? ok(code) : headingBreak(code)
    }

    return nok(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'headingBreak' implicitly has return type 'any' be... Remove this comment to see the full error message
  function headingBreak(code: any) {
    if (code === codes.numberSign) {
      effects.enter(types.atxHeadingSequence)
      return sequence(code)
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.atxHeading)
      return ok(code)
    }

    if (markdownSpace(code)) {
      return effects.attempt(
        createSpaceTokenizer(types.whitespace),
        headingBreak
      )(code)
    }

    effects.enter(types.atxHeadingText)
    return data(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'sequence' implicitly has return type 'any' becaus... Remove this comment to see the full error message
  function sequence(code: any) {
    if (code !== codes.numberSign) {
      effects.exit(types.atxHeadingSequence)
      return headingBreak(code)
    }

    effects.consume(code)
    return sequence
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'data' implicitly has return type 'any' because it... Remove this comment to see the full error message
  function data(code: any) {
    if (
      code === codes.eof ||
      code === codes.numberSign ||
      markdownLineEndingOrSpace(code)
    ) {
      effects.exit(types.atxHeadingText)
      return headingBreak(code)
    }

    effects.consume(code)
    return data
  }
}
