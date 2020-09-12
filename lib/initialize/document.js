exports.tokenize = initializeDocument

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var constants = require('../constant/constants')
var types = require('../constant/types')
var flatMap = require('../util/flat-map')
var createSpaceTokenizer = require('../tokenize/partial-space')
var blank = require('../tokenize/partial-blank-line')

var container = {tokenize: tokenizeContainer}
var flow = {tokenize: tokenizeLazyFlow}

function initializeDocument(effects) {
  var self = this
  var stack = []
  var continued = 0
  var inspectResult = {}
  var inspect = {tokenize: tokenizeInspect, partial: true}
  var childFlow
  var childToken

  return start

  function start(code) {
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

  function documentContinue(code) {
    continued++
    return start(code)
  }

  function documentContinued(code) {
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

  function containerContinue(code) {
    stack.push([self.currentConstruct, self.containerState])
    self.containerState = undefined
    return documentContinued(code)
  }

  function flowStart(code) {
    if (code === codes.eof) {
      return documentAtEof(code)
    }

    if (!childFlow) {
      childFlow = self.parser.flow(self.now())
    }

    effects.enter(types.chunkFlow)
    return flowContinue(code)
  }

  function flowContinue(code) {
    if (code === codes.eof) {
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

  function documentAfterPeek(code) {
    exitContainers(inspectResult.continued)
    continued = 0
    return start(code)
  }

  function documentAtEof(code) {
    assert(code === codes.eof, 'expected eof')
    exitContainers(code)
    effects.consume(code)
  }

  function continueFlow(token, atBreak) {
    token.contentType = constants.contentTypeFlow
    token._tokenizer = childFlow
    token._break = atBreak
    if (childToken) childToken.next = token
    token.previous = childToken
    childToken = token
    childFlow.lazy = inspectResult.lazy
    childFlow.defineSkip(token.start)
    flatMap(self.sliceStream(token), childFlow.write)
  }

  function exitContainers(size) {
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

  function tokenizeInspect(effects, ok) {
    var continued = 0

    inspectResult = {}

    return inspectStart

    function inspectStart(code) {
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

    function inspectContinue(code) {
      continued++
      return self.containerState._closeFlow ? flowEnd(code) : inspectStart(code)
    }

    function inspectContinued(code) {
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

    function less(code) {
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

    function lazy(code) {
      // Act as if all containers are continued.
      continued = stack.length
      inspectResult.lazy = true
      return flowContinue(code)
    }

    function flowContinue(code) {
      inspectResult.flowContinue = true
      return done(code)
    }

    // We’re done with flow if we have more containers, or an interruption.
    function flowEnd(code) {
      inspectResult.flowEnd = true
      return done(code)
    }

    function done(code) {
      inspectResult.continued = continued
      self.containerState = undefined
      self.interrupt = undefined
      return ok(code)
    }
  }
}

function tokenizeContainer(effects, ok, nok) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(this.parser.constructs.document, ok, nok)
  )
}

function tokenizeLazyFlow(effects, ok, nok) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.lazy(this.parser.constructs.flow, ok, nok)
  )
}
