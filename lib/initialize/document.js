exports.tokenize = initializeDocument

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var flatMap = require('../util/flat-map')

var blank = {tokenize: tokenizeBlank}
var container = {tokenize: tokenizeContainer}

// Internal type for lines of flow, which will later be replaced by their
// `_subevents`.
var flowLine = 'flowLine'

function initializeDocument(effects) {
  var self = this
  var inspectContinuation = {tokenize: tokenizeInspectContinuation}
  var stack = []
  var continued = 0
  var inspectionResult = {}
  var flowLineToken
  var flowTokenizer

  return start

  function start(code) {
    var length = stack.length

    if (continued < length) {
      return effects.attempt(
        stack[continued].continuation,
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
    var construct = flowTokenizer && flowTokenizer.context.currentConstruct
    var events = flowTokenizer && flowTokenizer.context.events
    var inContent =
      construct &&
      construct.name === 'content' &&
      // …and not at a blank line:
      events[events.length - 1][1].type !== types.lineEndingBlank

    if (inspectionResult.concrete) {
      return flowStart(code)
    }

    self.interrupt = inContent
    return effects.attempt(container, containerContinue, flowStart)(code)
  }

  function containerContinue(code) {
    stack.push(self.currentConstruct)
    return documentContinued(code)
  }

  function flowStart(code) {
    self.interrupt = undefined

    if (code === codes.eof) {
      return documentAtEof(code)
    }

    if (!flowTokenizer) {
      // To do: set position.
      flowTokenizer = self.parser.flow()
      flowTokenizer._pauses = []
      flowTokenizer._tokens = []
    }
    // To do: `move` current tokenizer.

    effects.enter(flowLine)
    return flowContinue(code)
  }

  function flowContinue(code) {
    if (code === codes.eof) {
      flowLineToken = effects.exit(flowLine)
      handleFlowLineToken()
      return documentAtEof(code)
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      flowLineToken = effects.exit(flowLine)
      handleFlowLineToken()
      return effects.check(inspectContinuation, documentAfterPeek)
    }

    effects.consume(code)
    return flowContinue
  }

  function documentAfterPeek(code) {
    if (inspectionResult.done) {
      handleEndOfFlow()
    }

    handleLessContainers(inspectionResult.continued)

    continued = 0
    return start(code)
  }

  function documentAtEof(code) {
    assert(code === codes.eof, 'expected eof')
    assert(!flowLineToken, 'expected no remaining flow data')

    if (flowTokenizer) {
      handleEndOfFlow()
    }

    handleLessContainers(0)
    effects.consume(code)
  }

  function handleLessContainers(size) {
    var length = stack.length

    while (length-- > size) {
      stack[length].exit.call(self, effects)
    }

    stack.length = size
  }

  function handleFlowLineToken() {
    var context = flowTokenizer.context

    context.lazy = inspectionResult.lazy
    flatMap(self.sliceStream(flowLineToken), flowTokenizer)
    flowTokenizer._tokens.push(flowLineToken)
    flowTokenizer._pauses.push(context.events.length)

    flowLineToken = undefined
  }

  function handleEndOfFlow() {
    var result = flowTokenizer(codes.eof)
    var pauses = flowTokenizer._pauses
    var tokens = flowTokenizer._tokens
    var length = tokens.length
    var index = -1
    var start = 0

    // Remove eof token.
    result.pop()

    // Ignore the last pause, it’s part of the last token.
    pauses.pop()

    while (++index < length) {
      tokens[index]._subevents = result.slice(start, pauses[index])
      start = pauses[index]
    }

    flowTokenizer = undefined
  }

  function tokenizeInspectContinuation(effects, ok) {
    var hooks = this.parser.hooks.flow
    var construct = flowTokenizer && flowTokenizer.context.currentConstruct
    var events = flowTokenizer && flowTokenizer.context.events
    // If we’re in content…
    var inContent =
      construct &&
      construct.name === 'content' &&
      // …and not at a blank line:
      events[events.length - 1][1].type !== types.lineEndingBlank

    inspectionResult = {continued: 0}

    return peekStart

    function peekStart(code) {
      var length = stack.length

      if (inspectionResult.continued < length) {
        return effects.attempt(
          stack[inspectionResult.continued].continuation,
          peekContinue,
          less
        )(code)
      }

      // If we’re continued but in a concrete flow, we can’t have more
      // containers.
      if (construct && construct.concrete) {
        return concrete(code)
      }

      self.interrupt = inContent
      return effects.attempt(container, done, even)(code)
    }

    function peekContinue(code) {
      inspectionResult.continued++
      return peekStart(code)
    }

    function less(code) {
      if (inContent) {
        return effects.lazy(hooks, done, content)(code)
      }

      // Otherwise we’re interrupting.
      return done(code)
    }

    // No interruption, but it might be a blank line?
    function content(code) {
      // To do: might need to change for lists?
      return effects.check(blank, done, lazy)(code)
    }

    function concrete(code) {
      inspectionResult.concrete = true
      return ok(code)
    }

    function lazy(code) {
      inspectionResult.lazy = true
      // Act as if all containers are continued.
      inspectionResult.continued = stack.length
      return ok(code)
    }

    // We’re done with flow if we have more containers, or an interruption.
    function done(code) {
      inspectionResult.done = true
      return even(code)
    }

    function even(code) {
      self.interrupt = undefined
      return ok(code)
    }
  }
}

function tokenizeBlank(effects, ok, nok) {
  return blank

  function blank(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return blank
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      return ok(code)
    }

    return nok(code)
  }
}

function tokenizeContainer(effects, ok, nok) {
  var prefixed = effects.attempt(this.parser.hooks.document, ok, nok)
  var size = 0

  return start

  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      return prefix(code)
    }

    return prefixed(code)
  }

  function prefix(code) {
    if (++size < constants.tabSize && markdownSpace(code)) {
      effects.consume(code)
      return prefix
    }

    effects.exit(types.linePrefix)
    return prefixed(code)
  }
}
