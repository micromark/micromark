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
var flow = {tokenize: tokenizeFlow}

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
    var construct = flowTokenizer && flowTokenizer.context.currentConstruct
    var events = flowTokenizer && flowTokenizer.context.events
    var inContent =
      construct &&
      construct.name === 'content' &&
      // …and not at a blank line:
      events[events.length - 1][1].type !== types.lineEndingBlank

    // If we’re in a concrete construct (such as when expecting another line of
    // HTML, or we resulted in lazy content), we can immediately start flow.
    if (inspectionResult.concrete || inspectionResult.lazy) {
      return flowStart(code)
    }

    self.interrupt = inContent
    self.containerState = {}
    return effects.attempt(container, containerContinue, flowStart)(code)
  }

  function containerContinue(code) {
    stack.push([self.currentConstruct, self.containerState])
    return documentContinued(code)
  }

  function flowStart(code) {
    self.containerState = continued ? stack[continued - 1][1] : undefined
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
    var trail

    if (inspectionResult.done) {
      trail = handleEndOfFlow()
    }

    handleLessContainers(inspectionResult.continued)
    fixTrail(trail)

    continued = 0
    return start(code)
  }

  function documentAtEof(code) {
    var trail

    assert(code === codes.eof, 'expected eof')
    assert(!flowLineToken, 'expected no remaining flow data')

    if (flowTokenizer) {
      trail = handleEndOfFlow()
    }

    handleLessContainers(0)
    fixTrail(trail)

    effects.consume(code)
  }

  function fixTrail(trail) {
    var events = self.events

    if (trail) {
      ;[].push.apply(events, trail)
    }

    var index = events.length
    var tail
    var t

    while (index) {
      t = events[index - 1]

      if (
        t[1].type === types.lineEnding ||
        t[1].type === types.lineEndingBlank
      ) {
        if (t[0] === 'enter') {
          t[1].type = types.lineEndingBlank
          tail = index
        }
      } else if (
        // Skip prefix.
        t[1].type === types.linePrefix ||
        // Skip empty flow lines.
        (t[1].type === flowLine &&
          (!t[1]._subevents || !t[1]._subevents.length))
      ) {
        // Empty.
      } else {
        break
      }

      index--
    }

    t = events[tail - 1]
    if (t) {
      t[1].type = types.lineEnding
    }
  }

  function handleLessContainers(size) {
    var trailingLines = removeTrail(self.events)
    var length = stack.length

    while (length-- > size) {
      self.containerState = stack[length][1]
      stack[length][0].exit.call(self, effects)
    }

    stack.length = size
    self.containerState = size ? stack[size - 1][1] : undefined
    ;[].push.apply(self.events, trailingLines)
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
    var start = 0
    var index = -1
    var trailingLines

    // Remove eof token.
    result.pop()

    // Ignore the last pause, it’s part of the last token.
    pauses.pop()

    // Remove trailing whitespace.
    trailingLines = removeTrail(result)

    while (++index < length) {
      tokens[index]._subevents = result.slice(start, pauses[index])
      start = pauses[index]
    }

    flowTokenizer = undefined

    return trailingLines
  }

  function removeTrail(result) {
    var state = stack.length && stack[stack.length - 1][1]
    var index = result.length
    var tail = index
    var t
    var trailingLines

    while (index) {
      t = result[index - 1]

      if (
        t[1].type === types.lineEnding ||
        t[1].type === types.lineEndingBlank
      ) {
        if (t[0] === 'enter') {
          tail = index - 1

          if (state && !state.xxxSupportsBlankLines) {
            break
          }
        }
      } else if (t[1].type === types.linePrefix) {
        // Empty.
      } else {
        break
      }

      index--
    }

    trailingLines = result.slice(tail)
    result.length = tail

    return trailingLines
  }

  function tokenizeInspectContinuation(effects, ok) {
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
        self.containerState = stack[inspectionResult.continued][1]
        return effects.attempt(
          stack[inspectionResult.continued][0].continuation,
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
      self.containerState = {}
      return effects.attempt(container, done, even)(code)
    }

    function peekContinue(code) {
      inspectionResult.continued++

      // Sometimes, containers remain open, but they still want to close flow.
      // Do as instructed.
      if (self.containerState.closeFlow) {
        inspectionResult.done = true
        return done(code)
      }

      return peekStart(code)
    }

    function less(code) {
      self.containerState =
        inspectionResult.continued > 0
          ? stack[inspectionResult.continued - 1][1]
          : undefined

      if (inContent) {
        // Maybe another container?
        self.containerState = {}
        return effects.attempt(container, done, noContainer)(code)
      }

      // Otherwise we’re interrupting.
      return done(code)
    }

    function noContainer(code) {
      return effects.attempt(flow, done, content)(code)
    }

    // No interruption, but it might be a blank line?
    function content(code) {
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
      self.containerState =
        inspectionResult.continued > 0
          ? stack[inspectionResult.continued - 1][1]
          : undefined

      inspectionResult.done = true
      self.interrupt = undefined
      return ok(code)
    }

    function even(code) {
      self.containerState =
        inspectionResult.continued > 0
          ? stack[inspectionResult.continued - 1][1]
          : undefined

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

function tokenizeFlow(effects, ok, nok) {
  var prefixed = effects.lazy(this.parser.hooks.flow, ok, nok)
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
