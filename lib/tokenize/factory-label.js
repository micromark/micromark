import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownSpace} from '../character/markdown-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'

// eslint-disable-next-line max-params
export function factoryLabel(effects, ok, nok, type, markerType, stringType) {
  const self = this
  let size = 0
  let data

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
      /* c8 ignore next */
      (code === codes.caret &&
        /* c8 ignore next */
        !size &&
        /* c8 ignore next */
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
