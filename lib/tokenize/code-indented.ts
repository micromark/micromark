exports.tokenize = tokenizeCodeIndented
exports.resolve = resolveCodeIndented

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'prefixSize'.
import prefixSize from '../util/prefix-size'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

var continuedIndent = {tokenize: tokenizeContinuedIndent, partial: true}

function resolveCodeIndented(events: any, context: any) {
  var index = events.length
  var lastBlankLine
  var token
  var code

  while (index--) {
    token = events[index][1]

    if (token.type === types.lineEnding) {
      lastBlankLine = token
      lastBlankLine.type = types.lineEndingBlank
    } else if (
      token.type !== types.lineEndingBlank &&
      token.type !== types.linePrefix
    ) {
      break
    }
  }

  if (lastBlankLine) {
    lastBlankLine.type = types.lineEnding
  }

  code = {
    type: types.codeIndented,
    start: events[0][1].start,
    end: token.end
  }

  // @ts-expect-error ts-migrate(2769) FIXME: Type 'any' is not assignable to type 'never'.
  return [].concat(
    [['enter', code, context]],
    events.slice(0, index + 1),
    [['exit', code, context]],
    events.slice(index + 1)
  )
}

function tokenizeCodeIndented(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var data: any

  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return lineEnd(code)
    }

    if (prefixSize(self.events) < constants.tabSize) {
      return end(code)
    }

    effects.enter(types.codeFlowValue)
    return content(code)
  }

  function content(code: any) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue)
      return lineEnd(code)
    }

    effects.consume(code)

    // Mark as valid if this is a non-whitespace.
    if (!markdownSpace(code)) {
      data = true
    }

    return content
  }

  function lineEnd(code: any) {
    if (!data || code === codes.eof) {
      return end(code)
    }

    return effects.check(continuedIndent, continued, end)
  }

  function continued(code: any) {
    assert(markdownLineEnding(code), 'expected a line ending or EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(
      createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
      afterPrefix
    )
  }

  function end(code: any) {
    return (data ? ok : nok)(code)
  }
}

function tokenizeContinuedIndent(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code: any) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(
        createSpaceTokenizer(types.linePrefix, constants.tabSize + 1),
        afterPrefix
      )
    }

    return prefixSize(self.events) < constants.tabSize ? nok(code) : ok(code)
  }
}
