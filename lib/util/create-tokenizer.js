'use strict'

module.exports = createTokenizer

var assert = require('assert')
var characters = require('./characters')

var debug = false

// Methods.
var own = {}.hasOwnProperty
var assign = Object.assign

function createTokenizer(initializer, from) {
  var resolveAlls = []
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var place = assign({}, from || {line: 1, column: 1, offset: index}, {
    index: index,
    bufferIndex: bufferIndex
  })

  // Parser state.
  var stack = [] // Current open tokens.
  var eventQueue = []

  var helpers = {
    sliceStream: sliceStream,
    sliceSerialize: sliceSerialize
  }

  var effects = {
    previous: null,
    previousToken: null,
    consume: consume,
    enter: enter,
    exit: exit,
    createHookableState: createHookableState,
    createConstructAttempt: createConstructAttempt,
    createConstruct: createConstruct
  }

  var state = initializer(effects)

  return write

  function write(value) {
    chunks.push(value)

    main()

    // To do: clear the queue for constructs that are done.

    // If we needed to buffer events due to `resolveAll`s, and we’re not done,
    // return an empty events list.
    if (value !== characters.eof) {
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

  function sliceSerialize(token) {
    var stream = sliceStream(token)
    var index = -1
    var length = stream.length
    var result = []
    var chunk
    var value
    var atTab = false

    while (++index < length) {
      chunk = stream[index]

      if (typeof chunk === 'string') {
        value = chunk
      } else if (chunk === characters.crlf) {
        value = '\r\n'
      } else if (chunk === characters.cr) {
        value = '\r'
      } else if (chunk === characters.lf) {
        value = '\n'
      } else if (chunk === characters.ht) {
        value = '\t'
      } else if (chunk === characters.vs) {
        value = atTab ? '' : ' '
      } else if (typeof chunk === 'number') {
        value = String.fromCharCode(chunk)
      } else {
        console.error(chunk)
        throw new Error('serialize: ' + chunk)
      }

      if (chunk === characters.ht) {
        atTab = true
      } else if (chunk !== characters.vs) {
        atTab = false
      }

      result.push(value)
    }

    // return buffer.slice(token.start.index, token.end.index)
    return result.join('')
  }

  function sliceStream(token) {
    var startIndex = token.start.index
    var startBufferIndex = token.start.bufferIndex
    var endIndex = token.end.index
    var endBufferIndex = token.end.bufferIndex
    var stream = chunks.slice(startIndex, endIndex + 1)
    var length = stream.length

    if (
      startIndex === endIndex &&
      startBufferIndex !== -1 &&
      endBufferIndex !== -1
    ) {
      stream[0] = stream[0].slice(startBufferIndex, endBufferIndex)
    } else {
      if (startBufferIndex !== -1) {
        stream[0] = stream[0].slice(startBufferIndex)
      }

      if (endBufferIndex === -1) {
        stream.pop()
      } else {
        stream[length - 1] = stream[length - 1].slice(0, endBufferIndex)
      }
    }

    return stream
  }

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main() {
    var chunk
    var nIndex

    while (index < chunks.length) {
      chunk = chunks[index]

      if (typeof chunk === 'string') {
        nIndex = index

        /* eslint-disable-next-line no-unmodified-loop-condition */
        while (bufferIndex !== chunk.length && index === nIndex) {
          if (bufferIndex === -1) {
            bufferIndex = 0
          }

          if (debug)
            console.info('main:buffer:', state.name, index, bufferIndex)
          state = state(chunk.charCodeAt(bufferIndex))
        }

        if (bufferIndex === chunk.length) {
          bufferIndex = -1
          index++
        }
      } else {
        if (debug) console.info('main:chunk:', state.name, index, bufferIndex)
        state = state(chunk)
      }
    }
  }

  // Move a character forward.
  function consume(code) {
    if (debug) console.info('consume:', [code])

    assert.ok(
      code === null || typeof code === 'number',
      'expected a numeric code'
    )

    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      place.line++
      place.column = 1
    }
    // Anything else.
    else {
      place.column++
    }

    // Not in a chunk.
    if (bufferIndex === -1) {
      index++
    } else {
      bufferIndex++
    }

    if (code === characters.crlf) {
      place.offset += 2
    } else {
      place.offset++
    }

    place.bufferIndex = bufferIndex
    place.index = index

    effects.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: now()}

    if (debug) console.group('enter:', type)

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

    assert.ok(
      !(
        token.start.index === token.end.index &&
        token.start.bufferIndex === token.end.bufferIndex
      ),
      'expected non-empty token (`' + type + '`)'
    )

    if (debug) console.groupEnd()
    if (debug) console.info('exit:', token.type)

    eventQueue.push(['exit', token, helpers])

    effects.previousToken = token

    return token
  }

  // Get the current point.
  function now() {
    return assign({}, place)
  }

  function createHookableState(hooks, returnState, bogusState) {
    var self = this
    var keys = Object.keys(hooks)

    resolveAlls = resolveAlls.concat(
      keys
        .flatMap((k) => hooks[k])
        .map((h) => h.resolveAll)
        .filter(Boolean)
        .filter((d, i, a) => a.indexOf(d) === i)
    )

    /* istanbul ignore next - bogus is optimized, which may be useful later. */
    return keys.length === 0 ? bogusState : hooked

    function hooked(code) {
      if (code === characters.eof) {
        return returnState(code)
      }

      if (own.call(hooks, code)) {
        return createConstructAttempt.call(
          self,
          hooks[code],
          returnState,
          bogusState
        )
      }

      return bogusState
    }
  }

  function createConstructAttempt(constructs, returnState, bogusState) {
    var self = this
    var multiple = 'length' in constructs
    var hookIndex = 0
    var startEventQueue = eventQueue.concat()
    var startPrevious = effects.previous
    var startPreviousToken = effects.previousToken
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPlace = now()
    var startDepth = stack.length
    var construct = multiple ? constructs[hookIndex] : constructs

    eventQueue = []

    return construct.tokenize.call(self, effects, ok, nok)

    function ok() {
      // To do: resolve is horrible. Make it pretty.
      var resolve = construct.resolve || identity
      var resolveTo = construct.resolveTo || identity
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
      if (debug) while (n--) console.groupEnd()

      // Reset.
      index = startIndex
      bufferIndex = startBufferIndex
      place = assign({}, startPlace)
      stack = stack.slice(0, startDepth)
      effects.previous = startPrevious
      effects.previousToken = startPreviousToken

      // Next construct.
      if (multiple && ++hookIndex < constructs.length) {
        eventQueue = []
        construct = constructs[hookIndex]
        return construct.tokenize.call(self, effects, ok, nok)
      }

      eventQueue = startEventQueue
      return bogusState
    }
  }

  function createConstruct(construct, returnState) {
    var self = this
    var startEventQueue = eventQueue.concat()

    eventQueue = []

    return construct.tokenize.call(self, effects, ok)

    function ok() {
      var resolve = construct.resolve || identity
      var resolveTo = construct.resolveTo || identity
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
