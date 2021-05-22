/**
 * @typedef {import('../../index.js').InitialConstruct} InitialConstruct
 * @typedef {import('../../index.js').Initializer} Initializer
 * @typedef {import('../../index.js').Construct} Construct
 * @typedef {import('../../index.js').TokenizeContext} TokenizeContext
 * @typedef {import('../../index.js').Tokenizer} Tokenizer
 * @typedef {import('../../index.js').Token} Token
 * @typedef {import('../../index.js').State} State
 */

/**
 * @typedef {Record<string, unknown>} StackState
 * @typedef {[Construct, StackState]} StackItem
 *
 * @typedef {{flowContinue: boolean, lazy: boolean, continued: number, flowEnd: boolean}} Result
 */

import assert from 'assert'
import {blankLine} from 'micromark-core-commonmark'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'
import {types} from 'micromark-util-symbol/types.js'

/** @type {InitialConstruct} */
export const document = {tokenize: initializeDocument}

/** @type {Construct} */
const containerConstruct = {tokenize: tokenizeContainer}
/** @type {Construct} */
const lazyFlowConstruct = {tokenize: tokenizeLazyFlow}

/** @type {Initializer} */
function initializeDocument(effects) {
  const self = this
  /** @type {StackItem[]} */
  const stack = []
  /** @type {Construct} */
  const inspectConstruct = {tokenize: tokenizeInspect, partial: true}
  let continued = 0
  /** @type {Result|undefined} */
  let inspectResult
  /** @type {TokenizeContext|undefined} */
  let childFlow
  /** @type {Token|undefined} */
  let childToken

  return start

  /** @type {State} */
  function start(code) {
    if (continued < stack.length) {
      const item = stack[continued]
      self.containerState = item[1]
      assert(
        item[0].continuation,
        'expected `contination` to be defined on container construct'
      )
      return effects.attempt(
        item[0].continuation,
        documentContinue,
        documentContinued
      )(code)
    }

    return documentContinued(code)
  }

  /** @type {State} */
  function documentContinue(code) {
    continued++
    return start(code)
  }

  /** @type {State} */
  function documentContinued(code) {
    // If we’re in a concrete construct (such as when expecting another line of
    // HTML, or we resulted in lazy content), we can immediately start flow.
    if (inspectResult && inspectResult.flowContinue) {
      return flowStart(code)
    }

    self.interrupt =
      childFlow &&
      childFlow.currentConstruct &&
      childFlow.currentConstruct.interruptible
    self.containerState = {}
    return effects.attempt(
      containerConstruct,
      containerContinue,
      flowStart
    )(code)
  }

  /** @type {State} */
  function containerContinue(code) {
    assert(
      self.currentConstruct,
      'expected `currentConstruct` to be defined on tokenizer'
    )
    assert(
      self.containerState,
      'expected `containerState` to be defined on tokenizer'
    )
    stack.push([self.currentConstruct, self.containerState])
    self.containerState = undefined
    return documentContinued(code)
  }

  /** @type {State} */
  function flowStart(code) {
    if (code === codes.eof) {
      exitContainers(0, true)
      effects.consume(code)
      return
    }

    childFlow = childFlow || self.parser.flow(self.now())

    effects.enter(types.chunkFlow, {
      contentType: constants.contentTypeFlow,
      previous: childToken,
      _tokenizer: childFlow
    })

    return flowContinue(code)
  }

  /** @type {State} */
  function flowContinue(code) {
    if (code === codes.eof) {
      continueFlow(effects.exit(types.chunkFlow))
      return flowStart(code)
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      continueFlow(effects.exit(types.chunkFlow))
      return effects.check(inspectConstruct, documentAfterPeek)
    }

    effects.consume(code)
    return flowContinue
  }

  /** @type {State} */
  function documentAfterPeek(code) {
    assert(inspectResult, 'expected `inspectResult` to be defined after peek')
    exitContainers(inspectResult.continued, inspectResult.flowEnd)
    continued = 0
    return start(code)
  }

  /**
   * @param {Token} token
   * @returns {void}
   */
  function continueFlow(token) {
    if (childToken) childToken.next = token
    childToken = token
    assert(childFlow, 'expected `childFlow` to be defined when continuing')
    childFlow.lazy = inspectResult ? inspectResult.lazy : false
    childFlow.defineSkip(token.start)
    childFlow.write(self.sliceStream(token))
  }

  /**
   * @param {number} size
   * @param {boolean} end
   * @returns {void}
   */
  function exitContainers(size, end) {
    let index = stack.length

    // Close the flow.
    if (childFlow && end) {
      childFlow.write([codes.eof])
      childToken = undefined
      childFlow = undefined
    }

    // Exit open containers.
    while (index-- > size) {
      self.containerState = stack[index][1]
      const entry = stack[index]
      assert(
        entry[0].exit,
        'expected `exit` to be defined on container construct'
      )
      entry[0].exit.call(self, effects)
    }

    stack.length = size
  }

  /** @type {Tokenizer} */
  function tokenizeInspect(effects, ok) {
    let subcontinued = 0

    inspectResult = {
      flowContinue: false,
      lazy: false,
      continued: 0,
      flowEnd: false
    }

    return inspectStart

    /** @type {State} */
    function inspectStart(code) {
      if (subcontinued < stack.length) {
        const entry = stack[subcontinued]
        self.containerState = entry[1]

        assert(
          entry[0].continuation,
          'expected `continuation` to be defined on container construct'
        )

        return effects.attempt(
          entry[0].continuation,
          inspectContinue,
          inspectLess
        )(code)
      }

      assert(
        childFlow,
        'expected `childFlow` to be defined when starting inspection'
      )

      // If we’re continued but in a concrete flow, we can’t have more
      // containers.
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        assert(
          inspectResult,
          'expected `inspectResult` to be defined when starting inspection'
        )
        inspectResult.flowContinue = true
        return inspectDone(code)
      }

      self.interrupt =
        childFlow.currentConstruct && childFlow.currentConstruct.interruptible
      self.containerState = {}
      return effects.attempt(
        containerConstruct,
        inspectFlowEnd,
        inspectDone
      )(code)
    }

    /** @type {State} */
    function inspectContinue(code) {
      subcontinued++
      assert(
        self.containerState,
        'expected `containerState` to be defined when continuing inspection'
      )
      return self.containerState._closeFlow
        ? inspectFlowEnd(code)
        : inspectStart(code)
    }

    /** @type {State} */
    function inspectLess(code) {
      assert(
        childFlow,
        'expected `childFlow` to be defined when inspecting less'
      )
      if (childFlow.currentConstruct && childFlow.currentConstruct.lazy) {
        // Maybe another container?
        self.containerState = {}
        return effects.attempt(
          containerConstruct,
          inspectFlowEnd,
          // Maybe flow, or a blank line?
          effects.attempt(
            lazyFlowConstruct,
            inspectFlowEnd,
            effects.check(blankLine, inspectFlowEnd, inspectLazy)
          )
        )(code)
      }

      // Otherwise we’re interrupting.
      return inspectFlowEnd(code)
    }

    /** @type {State} */
    function inspectLazy(code) {
      // Act as if all containers are continued.
      subcontinued = stack.length
      assert(
        inspectResult,
        'expected `inspectResult` to be defined when inspecting lazy'
      )
      inspectResult.lazy = true
      inspectResult.flowContinue = true
      return inspectDone(code)
    }

    // We’re done with flow if we have more containers, or an interruption.
    /** @type {State} */
    function inspectFlowEnd(code) {
      assert(
        inspectResult,
        'expected `inspectResult` to be defined when inspecting flow end'
      )
      inspectResult.flowEnd = true
      return inspectDone(code)
    }

    /** @type {State} */
    function inspectDone(code) {
      assert(
        inspectResult,
        'expected `inspectResult` to be defined when done inspecting'
      )
      inspectResult.continued = subcontinued
      self.interrupt = undefined
      self.containerState = undefined
      return ok(code)
    }
  }
}

/** @type {Tokenizer} */
function tokenizeContainer(effects, ok, nok) {
  return factorySpace(
    effects,
    effects.attempt(this.parser.constructs.document, ok, nok),
    types.linePrefix,
    this.parser.constructs.disable.null.includes('codeIndented')
      ? undefined
      : constants.tabSize
  )
}

/** @type {Tokenizer} */
function tokenizeLazyFlow(effects, ok, nok) {
  return factorySpace(
    effects,
    effects.lazy(this.parser.constructs.flow, ok, nok),
    types.linePrefix,
    this.parser.constructs.disable.null.includes('codeIndented')
      ? undefined
      : constants.tabSize
  )
}
