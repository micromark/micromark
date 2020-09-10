exports.tokenize = initializeDocument

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'flatMap'.
import flatMap from '../util/flat-map'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from '../tokenize/partial-space'
import blank from '../tokenize/partial-blank-line'

var container = {tokenize: tokenizeContainer}
var flow = {tokenize: tokenizeLazyFlow}

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'initializeDocument'.
function initializeDocument(effects: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var stack: any = []
  var continued = 0
  var inspectResult = {}
  var inspect = {tokenize: tokenizeInspect, partial: true}
  var childFlow: any
  var childToken: any

  return start

  function start(code: any) {
    if (continued < stack.length) {
      self.containerState = stack[continued][1]
      return effects.attempt(
        stack[continued][0].continuation,
        documentContinue,
        documentContinued
      )(code)
    }

    return documentContinued(code)
  }

  function documentContinue(code: any) {
    continued++
    return start(code)
  }

  function documentContinued(code: any) {
    // If we’re in a concrete construct (such as when expecting another line of
    // HTML, or we resulted in lazy content), we can immediately start flow.
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowContinue' does not exist on type '{}... Remove this comment to see the full error message
    if (inspectResult.flowContinue) {
      return flowStart(code)
    }

    self.interrupt =
      childFlow &&
      childFlow.currentConstruct &&
      childFlow.currentConstruct.name === 'content'
    self.containerState = {}
    return effects.attempt(container, containerContinue, flowStart)(code)
  }

  function containerContinue(code: any) {
    stack.push([self.currentConstruct, self.containerState])
    self.containerState = undefined
    return documentContinued(code)
  }

  function flowStart(code: any) {
    if (code === codes.eof) {
      return documentAtEof(code)
    }

    if (!childFlow) {
      childFlow = self.parser.flow(self.now())
    }

    effects.enter(types.chunkFlow)
    return flowContinue(code)
  }

  function flowContinue(code: any) {
    if (code === codes.eof) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
      continueFlow(effects.exit(types.chunkFlow))
      return documentAtEof(code)
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      continueFlow(effects.exit(types.chunkFlow), true)
      return effects.check(inspect, documentAfterPeek)
    }

    effects.consume(code)
    return flowContinue
  }

  function documentAfterPeek(code: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'continued' does not exist on type '{}'.
    exitContainers(inspectResult.continued)
    continued = 0
    return start(code)
  }

  function documentAtEof(code: any) {
    assert(code === codes.eof, 'expected eof')
    exitContainers(code)
    effects.consume(code)
  }

  function continueFlow(token: any, atBreak: any) {
    token.contentType = constants.contentTypeFlow
    token._tokenizer = childFlow
    token._break = atBreak
    if (childToken) childToken.next = token
    token.previous = childToken
    childToken = token
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'lazy' does not exist on type '{}'.
    childFlow.lazy = inspectResult.lazy
    childFlow.defineSkip(token.start)
    flatMap(self.sliceStream(token), childFlow.write)
  }

  function exitContainers(size: any) {
    var index

    // Close the flow.
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowEnd' does not exist on type '{}'.
    if (childFlow && (inspectResult.flowEnd || size === codes.eof)) {
      childFlow.write(codes.eof)
      childFlow = undefined
      childToken = undefined
    }

    // Exit open containers.
    index = stack.length

    while (index-- > size) {
      self.containerState = stack[index][1]
      stack[index][0].exit.call(self, effects)
    }

    stack.length = size
    self.containerState = undefined
  }

  function tokenizeInspect(effects: any, ok: any) {
    var continued = 0

    inspectResult = {}

    return inspectStart

    function inspectStart(code: any) {
      if (continued < stack.length) {
        self.containerState = stack[continued][1]
        return effects.attempt(
          stack[continued][0].continuation,
          inspectContinue,
          less
        )(code)
      }

      return inspectContinued(code)
    }

    function inspectContinue(code: any) {
      continued++
      return self.containerState._closeFlow ? flowEnd(code) : inspectStart(code)
    }

    function inspectContinued(code: any) {
      // If we’re continued but in a concrete flow, we can’t have more
      // containers.
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowContinue(code)
      }

      self.interrupt =
        childFlow.currentConstruct &&
        childFlow.currentConstruct.name === 'content'
      self.containerState = {}
      return effects.attempt(container, flowEnd, done)(code)
    }

    function less(code: any) {
      if (
        childFlow.currentConstruct &&
        childFlow.currentConstruct.name === 'content'
      ) {
        // Maybe another container?
        self.containerState = {}
        return effects.attempt(
          container,
          flowEnd,
          // Maybe flow, or a blank line?
          effects.attempt(flow, flowEnd, effects.check(blank, flowEnd, lazy))
        )(code)
      }

      // Otherwise we’re interrupting.
      return flowEnd(code)
    }

    function lazy(code: any) {
      // Act as if all containers are continued.
      continued = stack.length
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'lazy' does not exist on type '{}'.
      inspectResult.lazy = true
      return flowContinue(code)
    }

    function flowContinue(code: any) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowContinue' does not exist on type '{}... Remove this comment to see the full error message
      inspectResult.flowContinue = true
      return done(code)
    }

    // We’re done with flow if we have more containers, or an interruption.
    function flowEnd(code: any) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowEnd' does not exist on type '{}'.
      inspectResult.flowEnd = true
      return done(code)
    }

    function done(code: any) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'continued' does not exist on type '{}'.
      inspectResult.continued = continued
      self.containerState = undefined
      self.interrupt = undefined
      return ok(code)
    }
  }
}

function tokenizeContainer(effects: any, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    effects.attempt(this.parser.hooks.document, ok, nok)
  )
}

function tokenizeLazyFlow(effects: any, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    effects.lazy(this.parser.hooks.flow, ok, nok)
  )
}
