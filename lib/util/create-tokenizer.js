'use strict'

module.exports = micromark

var assert = require('assert')

// Characters.
var eof = NaN
var lineFeed = 10 // '\n'

// Methods.
var own = {}.hasOwnProperty
var assign = Object.assign

function micromark(initializer, from) {
  var resolveAlls = []
  var buffer = ''
  var index = 0
  var place = assign({}, from || {line: 1, column: 1, offset: index}, {
    index: index
  })

  // Parser state.
  var stack = [] // Current open tokens.
  var eventQueue = []

  var helpers = {
    slice: slice
  }

  var effects = {
    previous: eof,
    previousToken: null,
    consume: consume,
    enter: enter,
    exit: exit,
    createHookableState: createHookableState
  }

  var state = initializer(effects)

  return write

  function write(value) {
    var done = value === null

    if (done === false) {
      buffer += value
    }

    main(done)

    // To do: clear the queue for constructs that are done.

    // If we needed to buffer events due to `resolveAll`s, and we’re not done,
    // return an empty events list.
    if (done === false) {
      return []
    }

    // Otherwise, resolve, and exit.
    resolveAlls.forEach((resolveAll) => {
      eventQueue = resolveAll(eventQueue, helpers)
    })

    return eventQueue
  }

  //
  // Helpers.
  //

  function slice(token) {
    return buffer.slice(token.start.index, token.end.index)
  }

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main(end) {
    // If `end`, we also feed an EOF.
    // Which is finally consumed by the last state.
    var offset = end ? 1 : 0

    while (index < buffer.length + offset) {
      console.log('go:', state.name)
      state = state(buffer.charCodeAt(index))
    }
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(typeof code, 'number', 'expected a numeric code')

    console.info('consume:', [code])

    // Line ending; assumes CR is not used (that’s a to do).
    if (code === lineFeed) {
      place.line++
      place.column = 1
    }
    // Anything else.
    else {
      place.column++
    }

    index++

    place.offset++
    place.index = index

    effects.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: now()}

    console.group('enter:', type)

    eventQueue.push(['enter', token, helpers])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type) {
    var token

    assert.equal(
      stack[stack.length - 1].type,
      type,
      'expected exit token to match current token'
    )

    token = stack.pop()

    token.end = now()

    assert.notEqual(
      token.start.index,
      token.end.index,
      'expected non-empty token (`' + type + '`)'
    )

    console.groupEnd()
    console.info('exit:', token.type)

    eventQueue.push(['exit', token, helpers])

    effects.previousToken = token

    return token
  }

  // Get the current point.
  function now() {
    return assign({}, place)
  }

  function createHookableState(hooks, bogusTokenizer, returnState) {
    var done = returnState || defaultReturnState
    var keys = Object.keys(hooks)

    resolveAlls = resolveAlls.concat(
      keys
        .flatMap((k) => hooks[k])
        .map((h) => h.resolveAll)
        .filter(Boolean)
        .filter((d, i, a) => a.indexOf(d) === i)
    )

    /* istanbul ignore next - bogus is optimized, which may be useful later. */
    return keys.length === 0 ? bogus : hooked

    function hooked(code) {
      if (code !== code) {
        return done(code)
      }

      if (own.call(hooks, code)) {
        return createAttempt(hooks[code], done, bogus)
      }

      return bogus
    }

    function defaultReturnState(code) {
      // Make sure we eat EOFs.
      if (code !== code) {
        consume(code)
        return done
      }

      // Otherwise, try the hooks again.
      return hooked(code)
    }

    function bogus() {
      return createSureState(bogusTokenizer, done)
    }
  }

  function createAttempt(hooks, returnState, bogusState) {
    var multiple = 'length' in hooks
    var hookIndex = 0
    var startEventQueue = eventQueue.concat()
    var startPrevious = effects.previous
    var startPreviousToken = effects.previousToken
    var startIndex = index
    var startPlace = now()
    var startDepth = stack.length
    var hook = multiple ? hooks[hookIndex] : hooks

    eventQueue = []

    return hook.tokenize(effects, ok, nok)

    function ok() {
      // To do: resolve is horrible. Make it pretty.
      var resolve = hook.resolve || identity
      var resolveTo = hook.resolveTo || identity
      var tail

      eventQueue = resolveTo(
        startEventQueue.concat(resolve(eventQueue, helpers)),
        helpers
      )
      tail = eventQueue[eventQueue.length - 1]

      effects.previousToken = tail[1]
      assert.equal(tail[0], 'exit', 'expected end in exit')

      return returnState
    }

    function nok() {
      // Clear debugging.
      var n = 99
      while (n--) console.groupEnd()

      // Reset.
      index = startIndex
      place = assign({}, startPlace)
      stack = stack.slice(0, startDepth)
      effects.previous = startPrevious
      effects.previousToken = startPreviousToken

      // Next hook.
      if (multiple && ++hookIndex < hooks.length) {
        eventQueue = []
        hook = hooks[hookIndex]
        return hook.tokenize(effects, ok, nok)
      }

      eventQueue = startEventQueue
      return bogusState
    }
  }

  function createSureState(hook, returnState) {
    var startEventQueue = eventQueue.concat()

    eventQueue = []

    return hook.tokenize(effects, ok)

    // function sure() {
    //   return hook.tokenize(effects, ok)
    // }

    function ok() {
      var resolve = hook.resolve || identity
      var resolveTo = hook.resolveTo || identity
      var tail

      eventQueue = resolveTo(
        startEventQueue.concat(resolve(eventQueue, helpers)),
        helpers
      )
      tail = eventQueue[eventQueue.length - 1]

      if (tail) {
        effects.previousToken = tail[1]
        assert.equal(tail[0], 'exit', 'expected end in exit')
      }

      return returnState
    }
  }
}

function identity(x) {
  return x
}
