exports.tokenize = tokenizeCodeText
exports.resolve = resolveCodeText

import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import types from '../constant/types'

function resolveCodeText(events: any) {
  var length = events.length
  var tailExitIndex = length - 4
  var headEnterIndex = 3
  var tail = events[tailExitIndex][1]
  var head = events[headEnterIndex][1]
  var token
  var index

  // If we start and end with whitespace.
  if (
    (head.type === types.codeTextPaddingLineEnding ||
      head.type === types.codeTextPaddingWhitespace) &&
    (tail.type === types.codeTextPaddingLineEnding ||
      tail.type === types.codeTextPaddingWhitespace)
  ) {
    index = headEnterIndex

    // Look for data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === types.data) {
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  index = headEnterIndex - 1
  while (++index < tailExitIndex) {
    token = events[index][1]

    if (token.type === types.codeTextPaddingLineEnding) {
      token.type = types.lineEnding
    } else if (token.type === types.codeTextPaddingWhitespace) {
      token.type = types.data
    }
  }

  return events
}

function tokenizeCodeText(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var sizeOpen = 0
  var size: any
  var token: any

  return start

  function start(code: any) {
    if (
      code !== codes.graveAccent ||
      // If `previous` is set, there will always be a tail.
      (self.previous === codes.graveAccent &&
        self.events[self.events.length - 1][1].type !== types.characterEscape)
    ) {
      return nok(code)
    }

    effects.enter(types.codeText)
    effects.enter(types.codeTextSequence)
    return openingSequence(code)
  }

  // Opening fence.
  function openingSequence(code: any) {
    // More.
    if (code === codes.graveAccent) {
      effects.consume(code)
      sizeOpen++
      return openingSequence
    }

    effects.exit(types.codeTextSequence)
    return gap(code)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'gap' implicitly has return type 'any' because it ... Remove this comment to see the full error message
  function gap(code: any) {
    // EOF.
    if (code === codes.eof) {
      return nok(code)
    }

    // Closing fence?
    // Could also be data.
    if (code === codes.graveAccent) {
      token = effects.enter(types.codeTextSequence)
      size = 0
      return closingSequence(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.codeTextPaddingLineEnding)
      effects.consume(code)
      effects.exit(types.codeTextPaddingLineEnding)
      return gap
    }

    // Tabs don’t work, and virtual spaces don’t make sense.
    if (code === codes.space) {
      effects.enter(types.codeTextPaddingWhitespace)
      effects.consume(code)
      effects.exit(types.codeTextPaddingWhitespace)
      return gap
    }

    // Data.
    effects.enter(types.data)
    return data(code)
  }

  // In code.
  // @ts-expect-error ts-migrate(7023) FIXME: 'data' implicitly has return type 'any' because it... Remove this comment to see the full error message
  function data(code: any) {
    if (
      code === codes.eof ||
      code === codes.space ||
      code === codes.graveAccent ||
      markdownLineEnding(code)
    ) {
      effects.exit(types.data)
      return gap(code)
    }

    effects.consume(code)
    return data
  }

  // Closing fence.
  // @ts-expect-error ts-migrate(7023) FIXME: 'closingSequence' implicitly has return type 'any'... Remove this comment to see the full error message
  function closingSequence(code: any) {
    // More.
    if (code === codes.graveAccent) {
      effects.consume(code)
      size++
      return closingSequence
    }

    // Done!
    if (size === sizeOpen) {
      effects.exit(types.codeTextSequence)
      effects.exit(types.codeText)
      return ok(code)
    }

    // More or less accents: mark as data.
    token.type = types.data
    return data(code)
  }
}
