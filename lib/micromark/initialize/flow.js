/**
 * @typedef {import('../index.js').InitialConstruct} InitialConstruct
 * @typedef {import('../index.js').Initializer} Initializer
 * @typedef {import('../index.js').State} State
 */

import assert from 'assert'
import {markdownLineEnding} from '../../micromark-core-character/index.js'
import {blankLine, content} from '../../micromark-core-construct/index.js'
import {codes} from '../../micromark-core-symbol/codes.js'
import {types} from '../../micromark-core-symbol/types.js'
import {factorySpace} from '../../micromark-factory-space/index.js'

/** @type {InitialConstruct} */
export const flow = {tokenize: initializeFlow}

/** @type {Initializer} */
function initializeFlow(effects) {
  const self = this
  const initial = effects.attempt(
    // Try to parse a blank line.
    blankLine,
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
