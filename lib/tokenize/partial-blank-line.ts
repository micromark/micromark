
import type { Effects } from '../types'
import markdownLineEnding from '../character/markdown-line-ending'
import * as codes from '../character/codes'
import * as types from '../constant/types'
import createSpaceTokenizer from './partial-space'

export const partial = true

export const tokenize = function tokenizeBlankLine(effects: Effects, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix),
    afterWhitespace
  )

  function afterWhitespace(code: any) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
