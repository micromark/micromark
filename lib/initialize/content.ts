import type { Effects, Token } from '../types'
import * as assert from 'assert'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as constants from '../constant/constants'
import * as types from '../constant/types'

export default function initializeContent(effects: Effects) {
  var contentStart = effects.attempt(
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    this.parser.hooks.contentInitial,
    afterContentStartConstruct,
    paragraphInitial
  )
  var previous: Token

  return contentStart

  function afterContentStartConstruct(code: number) {
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

  function paragraphInitial(code: number) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected anything other than a line ending or EOF'
    )
    effects.enter(types.paragraph)
    return lineStart(code)
  }

  function lineStart(code: number) {
    var token = effects.enter(types.chunkParagraph)

    token.contentType = constants.contentTypeText
    token.previous = previous

    if (previous) {
      previous.next = token
    }

    previous = token

    return data(code)
  }

  function data(code: number) {
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
