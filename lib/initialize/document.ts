import type { Effects, Parser, Token, Okay, NotOkay } from '../types'
import * as assert from 'assert'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import flatMap from '../util/flat-map'
import createSpaceTokenizer from '../tokenize/partial-space'
import * as blank from '../tokenize/partial-blank-line'

var container = {tokenize: tokenizeContainer}
var flow = {tokenize: tokenizeLazyFlow}

export default function initializeDocument(this: {containerState: unknown, interrupt: unknown, parser: Parser, now: () => unknown, sliceStream: unknown}, effects: Effects) {
  var self = this
  var stack: unknown[] = []
  var continued = 0
  var inspectResult = {}
  var inspect = {tokenize: tokenizeInspect, partial: true}
  var childFlow: any
  var childToken: Token | undefined

  return start

  function start(code: number) {
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

  function documentContinue(code: number) {
    continued++
    return start(code)
  }

  function documentContinued(code: number) {
    // If we’re in a concrete construct (such as when expecting another line of
    // HTML, or we resulted in lazy content), we can immediately start flow.
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

  function flowContinue(code: number) {
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

  function documentAfterPeek(code: number) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'continued' does not exist on type '{}'.
    exitContainers(inspectResult.continued)
    continued = 0
    return start(code)
  }

  function documentAtEof(code: number) {
    assert(code === codes.eof, 'expected eof')
    exitContainers(code)
    effects.consume(code)
  }

  function continueFlow(token: Token, atBreak: any) {
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

  function exitContainers(size: number | null) {
    var index

    // Close the flow.
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

  function tokenizeInspect(effects: Effects, ok: Okay) {
    var continued = 0

    inspectResult = {}

    return inspectStart

    function inspectStart(code: number) {
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

    function inspectContinue(code: number) {
      continued++
      return self.containerState._closeFlow ? flowEnd(code) : inspectStart(code)
    }

    function inspectContinued(code: number) {
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

    function less(code: number) {
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

    function lazy(code: number) {
      // Act as if all containers are continued.
      continued = stack.length
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'lazy' does not exist on type '{}'.
      inspectResult.lazy = true
      return flowContinue(code)
    }

    function flowContinue(code: number) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowContinue' does not exist on type '{}... Remove this comment to see the full error message
      inspectResult.flowContinue = true
      return done(code)
    }

    // We’re done with flow if we have more containers, or an interruption.
    function flowEnd(code: number) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'flowEnd' does not exist on type '{}'.
      inspectResult.flowEnd = true
      return done(code)
    }

    function done(code: number) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'continued' does not exist on type '{}'.
      inspectResult.continued = continued
      self.containerState = undefined
      self.interrupt = undefined
      return ok(code)
    }
  }
}

function tokenizeContainer(this: {parser: Parser}, effects: Effects, ok: Okay, nok: NotOkay) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(this.parser.hooks.document, ok, nok)
  )
}

function tokenizeLazyFlow(this: {parser: Parser}, effects: Effects, ok: Okay, nok: NotOkay) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.lazy(this.parser.hooks.flow, ok, nok)
  )
}
