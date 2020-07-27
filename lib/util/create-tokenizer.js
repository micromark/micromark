module.exports = createTokenizer

var assert = require('assert')
var debug = require('debug')('micromark')
var assign = require('../constant/assign')
var codes = require('../character/codes')
var values = require('../character/values')
var markdownLineEnding = require('../character/markdown-line-ending')
var fromCharCode = require('../constant/from-char-code')
var own = require('../constant/has-own-property')
var shallow = require('../util/shallow')
var identity = require('../util/identity')
var entries = require('../util/entries')

function createTokenizer(initializer, from) {
  var attachedResolveAlls = []
  var expectedCode
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var now = assign({}, from || {line: 1, column: 1, offset: index}, {
    index: index,
    bufferIndex: bufferIndex
  })
  var previousCode = codes.eof

  // Parser state.
  var stack = [] // Current open tokens.
  var eventQueue = []

  var helpers = {
    sliceStream: sliceStream,
    sliceSerialize: sliceSerialize
  }

  var effects = {
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
    var length = stream.length
    var index = -1
    var result = []
    var chunk
    var value
    var atTab

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
      } else {
        assert(typeof chunk === 'number', 'expected number')
        // Currently only replacement character.
        value = fromCharCode(chunk)
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
    var chunkIndex

    while (index < chunks.length) {
      chunk = chunks[index]

      if (typeof chunk === 'string') {
        chunkIndex = index

        /* eslint-disable-next-line no-unmodified-loop-condition */
        while (bufferIndex !== chunk.length && index === chunkIndex) {
          if (bufferIndex === -1) {
            bufferIndex = 0
          }

          expectedCode = chunk.charCodeAt(bufferIndex)
          debug('main: passing `%s` to %s (buffer)', expectedCode, state.name)
          state = state(expectedCode)
        }

        if (bufferIndex === chunk.length) {
          bufferIndex = -1
          index++
        }
      } else {
        expectedCode = chunk
        debug('main: passing `%s` to %s (chunk)', expectedCode, state.name)
        state = state(expectedCode)
      }
    }
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(
      code,
      expectedCode,
      'expected given code to equal consumed code'
    )

    debug('consume: `%s`', code)

    if (markdownLineEnding(code)) {
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

    now.offset += code === codes.crlf ? 2 : 1
    now.bufferIndex = bufferIndex
    now.index = index

    previousCode = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: shallow(now)}

    debug('enter: `%s`', type)

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

    token.end = shallow(now)

    assert.ok(
      !(
        token.start.index === token.end.index &&
        token.start.bufferIndex === token.end.bufferIndex
      ),
      'expected non-empty token (`' + type + '`)'
    )

    debug('exit: `%s`', token.type)
    eventQueue.push(['exit', token, helpers])

    return token
  }

  function createConstructsAttempt(hooks, returnState, bogusState) {
    /* istanbul ignore next - Potentially useful optimization? */
    return entries(hooks) ? hooked : bogusState

    function hooked(code) {
      // To do: should this check be here?
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
    var ctx = {previous: previousCode, check: false, queue: info.queue}

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
    var ctx = {previous: previousCode, check: true, queue: info.queue}

    return construct.tokenize.call(ctx, effects, ok, nok)

    function ok() {
      info.restore()
      eventQueue = info.queue
      return returnState
    }

    function nok() {
      info.restore()
      eventQueue = info.queue
      return bogusState
    }
  }

  function createConstruct(construct, returnState) {
    var self = this
    var startEventQueue = eventQueue.concat()

    eventQueue = []

    return construct.tokenize.call(self, effects, ok)

    function ok() {
      /* istanbul ignore next - this function is currently only used for constructs w/ `resolve`. */
      var resolve = construct.resolve || identity
      var resolveTo = construct.resolveTo || identity

      eventQueue = resolveTo(
        startEventQueue.concat(resolve(eventQueue, helpers)),
        helpers
      )

      assert.equal(
        eventQueue[eventQueue.length - 1][0],
        'exit',
        'expected end in exit'
      )

      return returnState
    }
  }

  function store() {
    var startEventQueue = eventQueue.concat()
    var startPrevious = previousCode
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPlace = shallow(now)
    var startDepth = stack.length

    eventQueue = []

    return {restore: restore, queue: startEventQueue}

    function restore() {
      // Reset.
      index = startIndex
      bufferIndex = startBufferIndex
      now = shallow(startPlace)
      stack = stack.slice(0, startDepth)
      previousCode = startPrevious
    }
  }
}
