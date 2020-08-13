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
var movePoint = require('../util/move-point')

function createTokenizer(parser, initialize, from) {
  var now = from ? assign({}, from) : {line: 1, column: 1, offset: 0}
  var attachedResolveAlls = []
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var consumed = true
  var expectedCode

  // Current open tokens.
  var stack = []

  // Tools used for tokenizing.
  var effects = {
    consume: consume,
    enter: enter,
    exit: exit,
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    interrupt: constructFactory(onsuccessfulcheck, {interrupt: true}),
    lazy: constructFactory(onsuccessfulcheck, {lazy: true})
  }

  // State and tools for resolving, serializing.
  var context = {
    previous: codes.eof,
    events: [],
    parser: parser,
    sliceStream: sliceStream,
    sliceSerialize: sliceSerialize,
    shiftPoint: shiftPoint
  }

  var state = initialize.tokenize.call(context, effects)

  now.index = index
  now.bufferIndex = bufferIndex

  write.context = context

  return write

  function write(value) {
    var length
    var index

    chunks.push(value)

    main()

    // Exit if we’re not done, resolve might change stuff.
    if (value !== codes.eof) {
      return []
    }

    addResult(initialize, 0)

    // Otherwise, resolve, and exit.
    length = attachedResolveAlls.length
    index = -1

    while (++index < length) {
      context.events = attachedResolveAlls[index](context.events, context)
    }

    // Add EOF token.
    context.events.push(value)
    return context.events
  }

  //
  // Tools.
  //

  function shiftPoint(point, offset) {
    return movePoint(chunks, point, offset)
  }

  function sliceSerialize(token) {
    return serializeChunks(sliceChunks(chunks, token))
  }

  function sliceStream(token) {
    return sliceChunks(chunks, token)
  }

  //
  // State management.
  //

  // Main loop (note that `index` and `bufferIndex` are modified by `consume`).
  function main() {
    var chunk
    var chunkIndex

    while (index < chunks.length) {
      chunk = chunks[index]

      if (typeof chunk === 'string') {
        chunkIndex = index

        while (index === chunkIndex && bufferIndex < chunk.length) {
          if (bufferIndex < 0) {
            bufferIndex = 0
          }

          assert.equal(consumed, true, 'expected character to be consumed')
          expectedCode = chunk.charCodeAt(bufferIndex)
          debug('main: passing `%s` to %s (buffer)', expectedCode, state.name)
          consumed = undefined
          state = state(expectedCode)
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

    // Not in a string chunk.
    if (bufferIndex < 0) {
      index++
    } else {
      bufferIndex++
    }

    // At end of string chunk.
    if (bufferIndex > -1 && bufferIndex === chunks[index].length) {
      bufferIndex = -1
      index++
    }

    now.offset += code === codes.carriageReturnLineFeed ? 2 : 1
    now.bufferIndex = bufferIndex
    now.index = index

    context.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: shallow(now)}

    assert.equal(typeof type, 'string', 'expected string type')
    assert.notEqual(type.length, 0, 'expected non-empty string')
    debug('enter: `%s`', type)

    context.events.push(['enter', token, context])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type) {
    assert.equal(typeof type, 'string', 'expected string type')
    assert.notEqual(type.length, 0, 'expected non-empty string')

    var token = stack.pop()
    token.end = shallow(now)

    assert.equal(type, token.type, 'expected exit token to match current token')

    assert(
      !(
        token.start.index === token.end.index &&
        token.start.bufferIndex === token.end.bufferIndex
      ),
      'expected non-empty token (`' + type + '`)'
    )

    debug('exit: `%s`', token.type)
    context.events.push(['exit', token, context])

    return token
  }

  // Use results.
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from)
  }

  // Discard results.
  function onsuccessfulcheck(construct, info) {
    info.restore()
  }

  function constructFactory(onreturn, props) {
    return hook

    function hook(hooks, returnState, bogusState) {
      var constructs
      var multiple
      var hookIndex
      var currentConstruct
      var info

      return hooks.tokenize || 'length' in hooks
        ? handleConstructs(hooks)
        : handleHooks

      function handleHooks(code) {
        if (own.call(hooks, code)) {
          return handleConstructs(hooks[code])(code)
        }

        return bogusState(code)
      }

      function handleConstructs(list) {
        constructs = list
        multiple = 'length' in constructs
        hookIndex = 0
        currentConstruct = multiple ? constructs[hookIndex] : constructs
        return handleConstruct(currentConstruct)
      }

      function handleConstruct(construct) {
        info = store(construct)
        context.currentConstruct = construct
        return construct.tokenize.call(
          assign({}, context, props),
          effects,
          ok,
          nok
        )
      }

      function ok(code) {
        assert.equal(code, expectedCode, 'expected code')
        consumed = true
        onreturn(currentConstruct, info)
        return returnState
      }

      function nok(code) {
        assert.equal(code, expectedCode, 'expected code')
        consumed = true
        info.restore()

        if (multiple && ++hookIndex < constructs.length) {
          currentConstruct = constructs[hookIndex]
          return handleConstruct(currentConstruct)
        }

        return bogusState
      }
    }
  }

  function addResult(construct, from) {
    if (
      construct.resolveAll &&
      attachedResolveAlls.indexOf(construct.resolveAll) < 0
    ) {
      attachedResolveAlls.push(construct.resolveAll)
    }

    if (construct.resolve) {
      context.events = context.events
        .slice(0, from)
        .concat(construct.resolve(context.events.slice(from), context))
    }

    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context)
    }

    assert(
      context.events.length === 0 ||
        context.events[context.events.length - 1][0] === 'exit',
      'expected last token to end'
    )
  }

  function store() {
    var startPlace = shallow(now)
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPrevious = context.previous
    var startCurrentConstruct = context.currentConstruct
    var startEventsIndex = context.events.length
    // To do: perf of `concat` may be slow?
    var startStack = stack.concat()

    return {restore: restore, from: startEventsIndex}

    function restore() {
      now = startPlace
      index = startIndex
      bufferIndex = startBufferIndex
      context.previous = startPrevious
      context.currentConstruct = startCurrentConstruct
      context.events.length = startEventsIndex
      stack = startStack
    }
  }
}
