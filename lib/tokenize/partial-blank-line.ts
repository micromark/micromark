exports.tokenize = tokenizeBlankLine
exports.partial = true

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import codes from '../character/codes'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'

function tokenizeBlankLine(effects: any, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix),
    afterWhitespace
  )

  function afterWhitespace(code: any) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
