/**
 * @typedef {import('../types.js').Initializer} Initializer
 * @typedef {import('../types.js').Initialize} Initialize
 * @typedef {import('../types.js').Token} Token
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {factorySpace} from '../tokenize/factory-space.js'

/** @type {Initializer} */
export const content = {tokenize: initializeContent}

/** @type {Initialize} */
function initializeContent(effects) {
  const contentStart = effects.attempt(
    this.parser.constructs.contentInitial,
    afterContentStartConstruct,
    paragraphInitial
  )
  /** @type {Token} */
  let previous

  return contentStart

  /** @type {State} */
  function afterContentStartConstruct(code) {
    assert(
      code === codes.eof || markdownLineEnding(code),
      'expected eol or eof'
    )

    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return factorySpace(effects, contentStart, types.linePrefix)
  }

  /** @type {State} */
  function paragraphInitial(code) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected anything other than a line ending or EOF'
    )
    effects.enter(types.paragraph)
    return lineStart(code)
  }

  /** @type {State} */
  function lineStart(code) {
    const token = effects.enter(types.chunkText, {
      contentType: constants.contentTypeText,
      previous
    })

    if (previous) {
      previous.next = token
    }

    previous = token

    return data(code)
  }

  /** @type {State} */
  function data(code) {
    if (code === codes.eof) {
      effects.exit(types.chunkText)
      effects.exit(types.paragraph)
      effects.consume(code)
      return
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      effects.exit(types.chunkText)
      return lineStart
    }

    // Data.
    effects.consume(code)
    return data
  }
}
