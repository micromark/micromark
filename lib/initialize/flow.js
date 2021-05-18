/**
 * @typedef {import('../types.js').Initializer} Initializer
 * @typedef {import('../types.js').Initialize} Initialize
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {types} from '../constant/types.js'
import {content} from '../tokenize/content.js'
import {factorySpace} from '../tokenize/factory-space.js'
import {partialBlankLine} from '../tokenize/partial-blank-line.js'

/** @type {Initializer} */
export const flow = {tokenize: initializeFlow}

/** @type {Initialize} */
function initializeFlow(effects) {
  const self = this
  const initial = effects.attempt(
    // Try to parse a blank line.
    partialBlankLine,
    atBlankEnding,
    // Try to parse initial flow (essentially, only code).
    effects.attempt(
      this.parser.constructs.flowInitial,
      afterConstruct,
      factorySpace(
        effects,
        effects.attempt(
          this.parser.constructs.flow,
          afterConstruct,
          effects.attempt(content, afterConstruct)
        ),
        types.linePrefix
      )
    )
  )

  return initial

  /** @type {State} */
  function atBlankEnding(code) {
    assert(
      code === codes.eof || markdownLineEnding(code),
      'expected eol or eof'
    )

    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    effects.enter(types.lineEndingBlank)
    effects.consume(code)
    effects.exit(types.lineEndingBlank)
    self.currentConstruct = undefined
    return initial
  }

  /** @type {State} */
  function afterConstruct(code) {
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
    self.currentConstruct = undefined
    return initial
  }
}
