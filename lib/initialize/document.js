exports.tokenize = initializeDocument

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var flatMap = require('../util/flat-map')

// To do: support prefixes.
function initializeDocument(effects) {
  var inspectContinuation = {tokenize: tokenizeInspectContinuation}
  var flowHooks = this.parser.hooks.flow
  var hooks = this.parser.hooks.document
  var self = this
  var stack = []
  var continued = -1
  var inspectionContinuedResult
  var inspectionCloseFlowResult
  var currentFlowToken
  var currentFlowTokenizer

  return start

  function start(code) {
    if (++continued < stack.length) {
      return effects.attempt(
        stack[continued].continuation,
        start,
        flowStart
      )(code)
    }

    return effects.attempts(hooks, afterNewContainer, flowStart)(code)
  }

  function afterNewContainer(code) {
    stack.push(self.currentConstruct)
    return start(code)
  }

  function flowStart(code) {
    // || markdownLineEnding(code)
    if (code === codes.eof) {
      return atEof(code)
    }

    if (!currentFlowTokenizer) {
      handleCreateTokenizer()
    }
    // To do: `move` current tokenizer.

    effects.enter('data')
    return flowContinue(code)
  }

  function flowContinue(code) {
    // || markdownLineEnding(code)
    if (code === codes.eof) {
      currentFlowToken = effects.exit('data')
      handleCurrentFlowToken()
      return atEof(code)
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      currentFlowToken = effects.exit('data')
      handleCurrentFlowToken()

      if (stack.length) {
        return effects.check(inspectContinuation, onInspectContinuation)
      }

      return afterEol
    }

    effects.consume(code)
    return flowContinue
  }

  function onInspectContinuation(code) {
    if (inspectionCloseFlowResult) {
      handleEndOfFlow()
    }

    stack.slice(inspectionContinuedResult).forEach((d) => {
      effects.exit(d.name)
    })
    stack.length = inspectionContinuedResult

    return afterEol(code)
  }

  function afterEol(code) {
    assert(!inspectionCloseFlowResult, 'expected flow to be continued')

    continued = -1
    return start(code)
  }

  function atEof(code) {
    assert(code === codes.eof, 'expected eof')
    assert(!currentFlowToken, 'expected no remaining flow data')

    if (currentFlowTokenizer) {
      handleEndOfFlow()
    }

    // Exit everything that’s on the stack.
    stack.forEach((d) => {
      effects.exit(d.name)
    })
    effects.consume(code)
  }

  function handleCreateTokenizer() {
    // To do: set position.
    currentFlowTokenizer = self.parser.flow()
    currentFlowTokenizer._pauses = []
    currentFlowTokenizer._tokens = []
  }

  function handleCurrentFlowToken() {
    flatMap(self.sliceStream(currentFlowToken), currentFlowTokenizer)
    currentFlowTokenizer._tokens.push(currentFlowToken)
    currentFlowTokenizer._pauses.push(
      currentFlowTokenizer.context.events.length
    )
    currentFlowToken = undefined
  }

  function handleEndOfFlow() {
    var result = currentFlowTokenizer(codes.eof)
    var pauses = currentFlowTokenizer._pauses
    var tokens = currentFlowTokenizer._tokens
    var start = 0

    // Remove eof token.
    result.pop()

    // Ignore the last pop, it’s part of the last token.
    // To do: this might change if we merge EOLs in data tokens.
    pauses.pop()

    tokens.forEach((token, index) => {
      token._subevents = result.slice(start, pauses[index])
      start = pauses[index]
    })

    currentFlowTokenizer = undefined
    inspectionCloseFlowResult = undefined
  }

  function tokenizeInspectContinuation(code, ok) {
    inspectionContinuedResult = -1
    inspectionCloseFlowResult = false

    return continuation

    function continuation(code) {
      if (++inspectionContinuedResult < stack.length) {
        return effects.attempt(
          stack[inspectionContinuedResult].continuation,
          continuation,
          lessContainers
        )(code)
      }

      // All continued, see if we have more containers or are equal.
      // Return state means we have new containers.
      // Bogus state means we have the same number of containers.
      // To do: can we just skip this check?
      return effects.checks(hooks, moreContainers, ok)(code)
    }

    function moreContainers(code) {
      inspectionCloseFlowResult = true
      return ok(code)
    }

    function lessContainers(code) {
      if (
        currentFlowTokenizer &&
        currentFlowTokenizer.context.currentConstruct &&
        currentFlowTokenizer.context.currentConstruct.name === 'content'
      ) {
        return effects.interrupts(
          flowHooks,
          onInterruption,
          onLazyContinuation
        )(code)
      }

      // If we’re not in content, we’re interrupting.
      return onInterruption(code)
    }

    // The lazy content is interrupted.
    function onInterruption(code) {
      inspectionCloseFlowResult = true
      return ok(code)
    }

    // No interruption, the lazy content is content.
    function onLazyContinuation(code) {
      // Act as if all containers are continued.
      inspectionContinuedResult = stack.length
      return ok(code)
    }
  }
}
