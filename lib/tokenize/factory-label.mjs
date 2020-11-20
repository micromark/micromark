export default labelFactory

import assert from 'assert'
import * as codes from '../character/codes.mjs'
import markdownLineEnding from '../character/markdown-line-ending.mjs'
import markdownSpace from '../character/markdown-space.mjs'
import * as constants from '../constant/constants.mjs'
import * as types from '../constant/types.mjs'

// eslint-disable-next-line max-params
function labelFactory(effects, ok, nok, type, markerType, stringType) {
  var self = this
  var size = 0
  var data

  return start

  function start(code) {
    assert(code === codes.leftSquareBracket, 'expected `[`')
    effects.enter(type)
    effects.enter(markerType)
    effects.consume(code)
    effects.exit(markerType)
    effects.enter(stringType)
    return atBreak
  }

  function atBreak(code) {
    if (
      code === codes.eof ||
      code === codes.leftSquareBracket ||
      (code === codes.rightSquareBracket && !data) ||
      /* istanbul ignore next - footnotes. */
      (code === codes.caret &&
        !size &&
        '_hiddenFootnoteSupport' in self.parser.constructs) ||
      size > constants.linkReferenceSizeMax
    ) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket) {
      effects.exit(stringType)
      effects.enter(markerType)
      effects.consume(code)
      effects.exit(markerType)
      effects.exit(type)
      return ok
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return atBreak
    }

    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return label(code)
  }

  function label(code) {
    if (
      code === codes.eof ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket ||
      markdownLineEnding(code) ||
      size++ > constants.linkReferenceSizeMax
    ) {
      effects.exit(types.chunkString)
      return atBreak(code)
    }

    effects.consume(code)
    data = data || !markdownSpace(code)
    return code === codes.backslash ? labelEscape : label
  }

  function labelEscape(code) {
    if (
      code === codes.leftSquareBracket ||
      code === codes.backslash ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      size++
      return label
    }

    return label(code)
  }
}
