module.exports = createTokenizer

var assert = require('assert')
var assign = require('../constant/assign')
var codes = require('../character/codes')
var values = require('../character/values')
var fromCharCode = require('../constant/from-char-code')
var own = require('../constant/has-own-property')
var clone = require('../util/clone-point')
var identity = require('../util/identity')
var entries = require('../util/entries')

var debug = false

function createTokenizer(initializer, from) {
  var attachedResolveAlls = []
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var now = assign({}, from || {line: 1, column: 1, offset: index}, {
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
    previous: codes.eof,
    consume: consume,
    enter: enter,
    exit: exit,
    createConstructsAttempt: createConstructsAttempt,
    createConstructAttempt: createConstructAttempt,
    createConstruct: createConstruct,
    isConstruct: isConstruct
  }

  var state = initializer(effects)

  return write

  function write(value) {
    var length
    var index

    chunks.push(value)

    main()

    // To do: clear the queue for constructs that are done.

    // If we needed to buffer events due to `resolveAll`s, and we’re not done,
    // return an empty events list.
    if (value !== codes.eof) {
      return []
    }

    // Otherwise, resolve, and exit.
    length = attachedResolveAlls.length
    index = -1

    while (++index < length) {
      eventQueue = attachedResolveAlls[index](eventQueue, helpers)
    }

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
      } else if (chunk === codes.crlf) {
        value = values.crlf
      } else if (chunk === codes.cr) {
        value = values.carriageReturn
      } else if (chunk === codes.lf) {
        value = values.lineFeed
      } else if (chunk === codes.ht) {
        value = values.tab
      } else if (chunk === codes.vs) {
        if (atTab) continue
        value = values.space
      } else if (typeof chunk === 'number') {
        // Currently only replacement character.
        value = fromCharCode(chunk)
      } else {
        console.error(chunk)
        throw new Error('serialize: ' + chunk)
      }

      atTab = chunk === codes.ht
      result.push(value)
    }

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
      code === codes.eof || typeof code === 'number',
      'expected a numeric code'
    )

    if (code === codes.cr || code === codes.lf || code === codes.crlf) {
      now.line++
      now.column = 1
    }
    // Anything else.
    else {
      now.column++
    }

    // Not in a chunk.
    if (bufferIndex === -1) {
      index++
    } else {
      bufferIndex++
    }

    if (code === codes.crlf) {
      now.offset += 2
    } else {
      now.offset++
    }

    now.bufferIndex = bufferIndex
    now.index = index

    effects.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: clone(now)}

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

    token.end = clone(now)

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

    return token
  }

  function createConstructsAttempt(hooks, returnState, bogusState) {
    /* istanbul ignore next - Potentially useful optimization? */
    return entries(hooks) === true ? hooked : bogusState

    function hooked(code) {
      if (code === codes.eof) {
        return returnState(code)
      }

      if (own.call(hooks, code)) {
        return createConstructAttempt(hooks[code], returnState, bogusState)
      }

      return bogusState
    }
  }

  function createConstructAttempt(constructs, returnState, bogusState) {
    var multiple = 'length' in constructs
    var hookIndex = 0
    var construct = multiple ? constructs[hookIndex] : constructs
    var info = store()
    var ctx = {check: false, queue: info.queue}

    return construct.tokenize.call(ctx, effects, ok, nok)

    function ok() {
      // To do: resolve is horrible. Make it pretty.
      var resolve = construct.resolve || identity
      var resolveTo = construct.resolveTo || identity
      var resolveAll = construct.resolveAll

      if (
        typeof resolveAll === 'function' &&
        attachedResolveAlls.indexOf(resolveAll) === -1
      ) {
        attachedResolveAlls.push(resolveAll)
      }

      eventQueue = resolveTo(
        info.queue.concat(resolve(eventQueue, helpers)),
        helpers
      )

      assert.equal(
        eventQueue[eventQueue.length - 1][0],
        'exit',
        'expected end in exit'
      )

      return returnState
    }

    function nok() {
      // Clear debugging.
      var n = 99
      if (debug) while (n--) console.groupEnd()

      info.restore()

      // Next construct.
      if (multiple && ++hookIndex < constructs.length) {
        eventQueue = []
        construct = constructs[hookIndex]
        return construct.tokenize.call(ctx, effects, ok, nok)
      }

      eventQueue = info.queue
      return bogusState
    }
  }

  function isConstruct(construct, returnState, bogusState) {
    var info = store()
    var ctx = {check: true, queue: info.queue}

    return construct.tokenize.call(ctx, effects, ok, nok)

    function ok() {
      info.restore()
      eventQueue = info.queue
      return returnState
    }

    function nok() {
      // Clear debugging.
      var n = 99
      if (debug) while (n--) console.groupEnd()

      info.restore()
      eventQueue = info.queue
      return bogusState
    }
  }

  function store() {
    var startEventQueue = eventQueue.concat()
    var startPrevious = effects.previous
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPlace = clone(now)
    var startDepth = stack.length

    eventQueue = []

    return {restore: restore, queue: startEventQueue}

    function restore() {
      // Reset.
      index = startIndex
      bufferIndex = startBufferIndex
      now = clone(startPlace)
      stack = stack.slice(0, startDepth)
      effects.previous = startPrevious
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

      eventQueue = resolveTo(
        startEventQueue.concat(resolve(eventQueue, helpers)),
        helpers
      )

      if (eventQueue.length !== 0) {
        assert.equal(
          eventQueue[eventQueue.length - 1][0],
          'exit',
          'expected end in exit'
        )
      }

      return returnState
    }
  }
}
