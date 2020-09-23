module.exports = createTokenizer

var assert = require('assert')
var debug = require('debug')('micromark')
var assign = require('../constant/assign')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var chunkedSplice = require('./chunked-splice')
var shallow = require('./shallow')
var serializeChunks = require('./serialize-chunks')
var sliceChunks = require('./slice-chunks')
var resolveAll = require('./resolve-all')
var miniflat = require('./miniflat')

// Create a tokenizer.
// Tokenizers deal with one type of data (e.g., containers, flow, text).
// The parser is the object dealing with it all.
// `initialize` works like other constructs, except that only its `tokenize`
// function is used, in which case it doesn’t receive an `ok` or `nok`.
// `from` can be given to set the point before the first character, although
// when further lines are indented, they must be set with `defineSkip`.
function createTokenizer(parser, initialize, from) {
  var point = from ? assign({}, from) : {line: 1, column: 1, offset: 0}
  var columnStart = {}
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

  // State and tools for resolving and serializing.
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

  // The state function.
  var state = initialize.tokenize.call(context, effects)

  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize)
  }

  // Track which character we expect to be consumed, to catch bugs.
  var expectedCode

  // Store where we are in the input stream.
  point._index = index
  point._bufferIndex = bufferIndex

  return context

  function write(chunk) {
    chunks.push(chunk)

    main()

    // Exit if we’re not done, resolve might change stuff.
    if (chunk !== codes.eof) {
      return []
    }

    addResult(initialize, 0)

    // Otherwise, resolve, and exit.
    context.events = resolveAll(resolveAllConstructs, context.events, context)

    // Add EOF token.
    context.events.push(chunk)
    return context.events
  }

  //
  // Tools.
  //

  function sliceSerialize(token) {
    return serializeChunks(sliceStream(token))
  }

  function sliceStream(token) {
    return sliceChunks(chunks, token)
  }

  function now() {
    return shallow(point)
  }

  function defineSkip(value) {
    columnStart[value.line] = value.column
    accountForPotentialSkip()
    debug('position: define skip: `%j`', point)
  }

  //
  // State management.
  //

  // Main loop (note that `index` and `bufferIndex` are modified by `consume`).
  // Here is where we walk through the chunks, which either include strings of
  // several characters, or numerical character codes.
  // The reason to do this in a loop instead of a call is so the stack can
  // drain.
  function main() {
    var chunk
    var chunkIndex

    while (index < chunks.length) {
      chunk = chunks[index]

      // If we’re in a buffer chunk, loop through it.
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
        assert.equal(consumed, true, 'expected character to be consumed')
        expectedCode = chunk
        debug('main: passing `%s` to %s (chunk)', expectedCode, state.name)
        consumed = undefined
        state = state(expectedCode)
      }
    }
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(
      code,
      expectedCode,
      'expected given code to equal expected code'
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
      point.column = 1
      point.offset += code === codes.carriageReturnLineFeed ? 2 : 1
      accountForPotentialSkip()
      debug('position: after eol: `%j`', point)
    } else if (code !== codes.virtualSpace) {
      point.column++
      point.offset++
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

    point._bufferIndex = bufferIndex
    point._index = index

    // Expose the previous character.
    context.previous = code
  }

  // Start a token.
  function enter(type, fields) {
    var token = fields || {}
    token.type = type
    token.start = now()

    assert.equal(typeof type, 'string', 'expected string type')
    assert.notEqual(type.length, 0, 'expected non-empty string')
    debug('enter: `%s`', type)

    context.events.push(['enter', token, context])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type, fields) {
    assert.equal(typeof type, 'string', 'expected string type')
    assert.notEqual(type.length, 0, 'expected non-empty string')
    assert(stack.length, 'cannot close w/o open tokens')

    var token = stack.pop()
    token.end = now()

    if (fields) assign(token, fields)

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

  // Factory to attempt/check/interrupt.
  function constructFactory(onreturn, fields) {
    return hook

    // Handle either an object mapping codes to constructs, a list of
    // constructs, or a single construct.
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
        var list = miniflat(constructs[code]).concat(miniflat(constructs.null))

        if (code !== codes.eof && list.length) {
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
            assign({}, context, fields),
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
      chunkedSplice(
        context.events,
        from,
        context.events.length - from,
        construct.resolve(context.events.slice(from), context)
      )
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
      bufferIndex = startBufferIndex
      context.previous = startPrevious
      context.currentConstruct = startCurrentConstruct
      context.events.length = startEventsIndex
      stack = startStack
      accountForPotentialSkip()
      debug('position: restore: `%j`', point)
    }
  }

  function accountForPotentialSkip() {
    if (point.line in columnStart && point.column === 1) {
      point.column = columnStart[point.line]
      point.offset += columnStart[point.line] - 1
    }
  }
}
