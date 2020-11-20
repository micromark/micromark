var partialBlankLine = {
  tokenize: tokenizePartialBlankLine,
  partial: true
}
export default partialBlankLine

import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as types from '../constant/types'
import spaceFactory from './factory-space'

function tokenizePartialBlankLine(effects, ok, nok) {
  return spaceFactory(effects, afterWhitespace, types.linePrefix)

  function afterWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
