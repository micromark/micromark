module.exports = createTokenizer

var assert = require('assert')
var debug = require('debug')('micromark')
var assign = require('../constant/assign')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var own = require('../constant/has-own-property')
var shallow = require('../util/shallow')
var serializeChunks = require('../util/serialize-chunks')
var sliceChunks = require('../util/slice-chunks')

function createTokenizer(parser, initialize, from) {
  var now = assign({}, from || {line: 1, column: 1, offset: 0})
  var attachedResolveAlls = []
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var last = codes.eof
  var consumed = true
  var expectedCode

  // Parser state.
  var stack = [] // Current open tokens.
  var events = []

  var effects = {
    consume: consume,
    enter: enter,
    exit: exit,
    createConstructsAttempt: hookableFactory(createConstructAttempt),
    createConstructAttempt: createConstructAttempt,
    isConstructs: hookableFactory(isConstruct),
    isConstruct: isConstruct
  }

  var context = {
    parser: parser,
    sliceStream: sliceStream,
    sliceSerialize: sliceSerialize
  }

  var state = initialize.tokenize.call(
    assign({}, context, {previous: last, queue: events}),
    effects
  )

  now.index = index
  now.bufferIndex = bufferIndex

  return write

  function write(value) {
    var length
    var index

    chunks.push(value)

    main()

    // If we needed to buffer events due to `resolveAll`s, and we’re not done,
    // return an empty events list.
    if (value !== codes.eof) {
      return []
    }

    addResult(initialize, [])

    // Otherwise, resolve, and exit.
    length = attachedResolveAlls.length
    index = -1

    while (++index < length) {
      events = attachedResolveAlls[index](events, context)
    }

    return events
  }

  //
  // Tools.
  //

  function sliceSerialize(token) {
    return serializeChunks(sliceChunks(chunks, token))
  }

  function sliceStream(token) {
    return sliceChunks(chunks, token)
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

        while (bufferIndex !== chunk.length && index === chunkIndex) {
          if (bufferIndex < 0) {
            bufferIndex = 0
          }

          expectedCode = chunk.charCodeAt(bufferIndex)
          debug('main: passing `%s` to %s (buffer)', expectedCode, state.name)
          assert.equal(consumed, true, 'expected character to be consumed')
          consumed = undefined
          state = state(expectedCode)
        }

        if (bufferIndex === chunk.length) {
          bufferIndex = -1
          index++
        }
      } else {
        expectedCode = chunk
        consumed = undefined
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
    assert.equal(consumed, undefined, 'expected code to not have been consumed')
    consumed = true

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
    if (bufferIndex < 0) {
      index++
    } else {
      bufferIndex++
    }

    now.offset += code === codes.crlf ? 2 : 1
    now.bufferIndex = bufferIndex
    now.index = index

    last = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: shallow(now)}

    debug('enter: `%s`', type)

    events.push(['enter', token, context])

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

    assert(
      !(
        token.start.index === token.end.index &&
        token.start.bufferIndex === token.end.bufferIndex
      ),
      'expected non-empty token (`' + type + '`)'
    )

    debug('exit: `%s`', token.type)
    events.push(['exit', token, context])

    return token
  }

  function hookableFactory(func) {
    return hookable

    function hookable(hooks, returnState, bogusState) {
      return hooked

      function hooked(code) {
        if (own.call(hooks, code)) {
          debug('hook: %s', func.name)
          return func(hooks[code], returnState, bogusState)(code)
        }

        // Allow draining.
        consumed = true
        return bogusState
      }
    }
  }

  function createConstructAttempt(constructs, returnState, bogusState) {
    var multiple = 'length' in constructs
    var hookIndex = 0
    var construct = multiple ? constructs[hookIndex] : constructs
    var info = store()
    var ctx = assign({}, context, {previous: last, queue: info.queue})

    debug('attempt: %s', construct.tokenize.name)
    return construct.tokenize.call(ctx, effects, ok, nok)

    function ok(code) {
      addResult(construct, info.queue)
      return returnState(code)
    }

    function nok() {
      info.restore()

      // Allow draining.
      consumed = true

      // Next construct.
      if (multiple && ++hookIndex < constructs.length) {
        events = []
        construct = constructs[hookIndex]
        debug('attempt: %s (retry)', construct.tokenize.name)
        return construct.tokenize.call(ctx, effects, ok, nok)
      }

      events = info.queue
      return bogusState
    }
  }

  function isConstruct(construct, returnState, bogusState) {
    var info = store()

    debug('is: %s', construct.tokenize.name)
    return construct.tokenize.call(
      assign({}, context, {previous: last, check: true, queue: info.queue}),
      effects,
      resetFactory(returnState),
      resetFactory(bogusState)
    )

    function resetFactory(state) {
      return reset
      function reset() {
        info.restore()
        events = info.queue
        // Allow draining.
        consumed = true
        return state
      }
    }
  }

  function addResult(construct, before) {
    var resolve = construct.resolve
    var resolveTo = construct.resolveTo
    var resolveAll = construct.resolveAll
    var tail

    if (resolveAll && attachedResolveAlls.indexOf(resolveAll) < 0) {
      attachedResolveAlls.push(resolveAll)
    }

    if (resolve) {
      events = resolve(events, context)
    }

    events = before.concat(events)

    if (resolveTo) {
      events = resolveTo(events, context)
    }

    tail = events[events.length - 1]
    assert(!tail || tail[0] === 'exit', 'expected end in exit')
  }

  function store() {
    var startPlace = shallow(now)
    var startEvents = events.concat()
    var startLast = last
    var startIndex = index
    var startDepth = stack.length
    var startBufferIndex = bufferIndex

    events = []

    return {restore: restore, queue: startEvents}

    function restore() {
      // Reset.
      index = startIndex
      bufferIndex = startBufferIndex
      now = shallow(startPlace)
      stack = stack.slice(0, startDepth)
      last = startLast
    }
  }
}
