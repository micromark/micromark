exports.tokenize = initializeContent

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import constants from '../constant/constants'
import types from '../constant/types'

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'initializeContent'.
function initializeContent(effects: any) {
  var contentStart = effects.attempt(
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    this.parser.hooks.contentInitial,
    afterContentStartConstruct,
    paragraphInitial
  )
  var previous: any

  return contentStart

  function afterContentStartConstruct(code: any) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected a line ending EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return contentStart
  }

  function paragraphInitial(code: any) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected anything other than a line ending or EOF'
    )
    effects.enter(types.paragraph)
    return lineStart(code)
  }

  function lineStart(code: any) {
    var token = effects.enter(types.chunkParagraph)

    token.contentType = constants.contentTypeText
    token.previous = previous

    if (previous) {
      previous.next = token
    }

    previous = token

    return data(code)
  }

  function data(code: any) {
    if (code === codes.eof) {
      effects.exit(types.chunkParagraph)
      effects.exit(types.paragraph)
      effects.consume(code)
      return
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      effects.exit(types.chunkParagraph)._break = true
      return lineStart
    }

    // Data.
    effects.consume(code)
    return data
  }
}
