import type { Effects, Event, NotOkay, Okay, Token } from '../types'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import markdownSpace from '../character/markdown-space'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import shallow from '../util/shallow'
import createSpaceTokenizer from './partial-space'

export function resolveWhitespace(events: Event[], context: unknown) {
  var head = events[0][1]
  var lineEnding = events.length > 2 && events[2][1]
  var result = events
  var token

  if (head.type === types.whitespace) {
    if (
      !head._tabs &&
      lineEnding &&
      lineEnding.type === types.lineEnding &&
      head._size >= constants.hardBreakPrefixSizeMin
    ) {
      token = {
        type: types.hardBreakTrailing,
        start: shallow(head.start),
        end: shallow(lineEnding.start)
      }

      // @ts-expect-error ts-migrate(2769) FIXME: Type 'any' is not assignable to type 'never'.
      result = [].concat(
        [['enter', token, context]],
        events.slice(0, 2),
        [['exit', token, context]],
        events.slice(2)
      )
    } else {
      head.type = types.lineSuffix
    }
  }

  return result
}


export const tokenize = function tokenizeWhitespace(effects: Effects, ok: Okay, nok: NotOkay) {
  var token: Token

  return start

  function start(code: number) {
    if (markdownSpace(code)) {
      token = effects.enter(types.whitespace)
      token._size = 0
      return whitespace(code)
    }

    // istanbul ignore next - Hooks.
    if (!markdownLineEnding(code)) nok(code)

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(createSpaceTokenizer(types.linePrefix), ok)
  }

  function whitespace(code: number) {
    if (code === codes.eof) {
      effects.exit(types.whitespace)
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      token._size++

      if (code === codes.horizontalTab) {
        token._tabs = true
      }

      return whitespace
    }

    if (markdownLineEnding(code)) {
      effects.exit(types.whitespace)
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(createSpaceTokenizer(types.linePrefix), ok)
    }

    // Mark as normal data.
    token.type = types.data
    effects.exit(types.data)
    return ok(code)
  }
}
