module.exports = createTokenizer

var assert = require('assert')
var debug = require('debug')('micromark')
var assign = require('../constant/assign')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var shallow = require('./shallow')
var serializeChunks = require('./serialize-chunks')
var sliceChunks = require('./slice-chunks')
var resolveAll = require('./resolve-all')

function createTokenizer(parser, initialize, from) {
  var point = from ? assign({}, from) : {line: 1, column: 1, offset: 0}
  var columnStart = []
  var resolveAllConstructs = []
  var chunks = []
  var index = 0
  var bufferIndex = -1
  var consumed = true

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
    now: now,
    defineSkip: defineSkip,
    write: write
  }

  var state = initialize.tokenize.call(context, effects)

  var expectedCode

  point._index = index
  point._bufferIndex = bufferIndex

  return context

  function write(value) {
    chunks.push(value)

    main()

    // Exit if we’re not done, resolve might change stuff.
    if (value !== codes.eof) {
      return []
    }

    addResult(initialize, 0)

    // Otherwise, resolve, and exit.
    context.events = resolveAll(resolveAllConstructs, context.events, context)

    // Add EOF token.
    context.events.push(value)
    return context.events
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

  function now() {
    return shallow(point)
  }

  function defineSkip(value) {
    columnStart[value.line] = value.column

    // If we’re currently at that point:
    if (point.column === 1 && point.line === value.line) {
      point.column = value.column
      point.offset += value.column - 1
    }
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

    debug('consume: `%s`', code)

    assert.equal(consumed, undefined, 'expected code to not have been consumed')
    consumed = true
    assert(
      code === null
        ? !context.events.length ||
            context.events[context.events.length - 1][0] === 'exit'
        : context.events[context.events.length - 1][0] === 'enter',
      'expected last token to be open'
    )

    if (markdownLineEnding(code)) {
      point.line++
      if (point.line in columnStart) {
        point.column = columnStart[point.line]
        point.offset += columnStart[point.line] - 1
      } else {
        point.column = 1
      }
    }
    // Anything else.
    else if (code !== codes.virtualSpace) {
      point.column++
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

    if (code !== codes.virtualSpace) {
      point.offset += code === codes.carriageReturnLineFeed ? 2 : 1
    }

    point._bufferIndex = bufferIndex
    point._index = index

    context.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: now()}

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
    assert(stack.length, 'cannot close w/o open tokens')

    var token = stack.pop()
    token.end = now()

    assert.equal(type, token.type, 'expected exit token to match current token')

    assert(
      !(
        token.start._index === token.end._index &&
        token.start._bufferIndex === token.end._bufferIndex
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

    function hook(constructs, returnState, bogusState) {
      var listOfConstructs
      var constructIndex
      var multiple
      var currentConstruct
      var info

      return constructs.tokenize || 'length' in constructs
        ? handleListOfConstructs(constructs)
        : handleMapOfConstructs

      function handleMapOfConstructs(code) {
        var list =
          code === null
            ? []
            : [].concat(constructs[code] || [], constructs.null || [])

        if (list.length) {
          return handleListOfConstructs(list)(code)
        }

        return bogusState(code)
      }

      function handleListOfConstructs(list) {
        listOfConstructs = list
        multiple = 'length' in listOfConstructs
        constructIndex = 0
        currentConstruct = multiple
          ? listOfConstructs[constructIndex]
          : listOfConstructs
        return handleConstruct(currentConstruct)
      }

      function handleConstruct(construct) {
        return start

        function start(code) {
          info = store()

          if (!construct.partial) {
            context.currentConstruct = construct
          }

          return construct.tokenize.call(
            assign({}, context, props),
            effects,
            ok,
            nok
          )(code)
        }
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

        if (multiple && ++constructIndex < listOfConstructs.length) {
          currentConstruct = listOfConstructs[constructIndex]
          return handleConstruct(currentConstruct)
        }

        return bogusState
      }
    }
  }

  function addResult(construct, from) {
    if (construct.resolveAll && resolveAllConstructs.indexOf(construct) < 0) {
      resolveAllConstructs.push(construct)
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
    var startPoint = now()
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPrevious = context.previous
    var startCurrentConstruct = context.currentConstruct
    var startEventsIndex = context.events.length
    // To do: perf of `concat` may be slow?
    var startStack = stack.concat()

    return {restore: restore, from: startEventsIndex}

    function restore() {
      point = startPoint
      index = startIndex

      // Sometimes, we reset to directly after a line ending.
      // Make sure to indent.
      if (point.line in columnStart && point.column === 1) {
        point.column = columnStart[point.line]
        point.offset += columnStart[point.line] - 1
      }

      bufferIndex = startBufferIndex
      context.previous = startPrevious
      context.currentConstruct = startCurrentConstruct
      context.events.length = startEventsIndex
      stack = startStack
    }
  }
}
