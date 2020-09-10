import type { Parser, Point } from '../types'
import * as assert from 'assert'
import * as debugInitializer from 'debug'
import assign from '../constant/assign'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import own from '../constant/has-own-property'
import shallow from '../util/shallow'
import serializeChunks from '../util/serialize-chunks'
import sliceChunks from '../util/slice-chunks'

const debug = debugInitializer('micromark')

export default function createTokenizer(parser: Parser, initialize: unknown, from: Point) {
  var point = from ? assign({}, from) : {line: 1, column: 1, offset: 0}
  var columnStart: any[] = []
  var attachedResolveAlls: any[] = []
  var chunks: any[] = []
  var index = 0
  var bufferIndex = -1
  var consumed = true

  // Current open tokens.
  var stack: any = []

  // Tools used for tokenizing.
  var effects = {
    consume: consume,
    enter: enter,
    exit: exit,
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    attempt: constructFactory(onsuccessfulconstruct),
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
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

  var expectedCode: any

  point._index = index
  point._bufferIndex = bufferIndex

  return context

  function write(value: any) {
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
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    context.events.push(value)
    return context.events
  }

  //
  // Tools.
  //

  function sliceSerialize(token: any) {
    return serializeChunks(sliceChunks(chunks, token))
  }

  function sliceStream(token: any) {
    return sliceChunks(chunks, token)
  }

  function now() {
    return shallow(point)
  }

  function defineSkip(value: any) {
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
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'boolea... Remove this comment to see the full error message
          consumed = undefined
          state = state(expectedCode)
        }
      } else {
        expectedCode = chunk
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'boolea... Remove this comment to see the full error message
        consumed = undefined
        debug('main: passing `%s` to %s (chunk)', expectedCode, state.name)
        state = state(expectedCode)
      }
    }
  }

  // Move a character forward.
  function consume(code: any) {
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
  function enter(type: any) {
    var token = {type: type, start: now()}

    assert.equal(typeof type, 'string', 'expected string type')
    assert.notEqual(type.length, 0, 'expected non-empty string')
    debug('enter: `%s`', type)

    // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
    context.events.push(['enter', token, context])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type: any) {
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
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
    context.events.push(['exit', token, context])

    return token
  }

  // Use results.
  function onsuccessfulconstruct(construct: any, info: any) {
    addResult(construct, info.from)
  }

  // Discard results.
  function onsuccessfulcheck(construct: any, info: any) {
    info.restore()
  }

  function constructFactory(onreturn: any, props: any) {
    return hook

    function hook(hooks: any, returnState: any, bogusState: any) {
      var constructs: any
      var multiple: any
      var hookIndex: any
      var currentConstruct: any
      var info: any

      return hooks.tokenize || 'length' in hooks
        ? handleConstructs(hooks)
        : handleHooks

      function handleHooks(code: any) {
        if (own.call(hooks, code)) {
          return handleConstructs(hooks[code])(code)
        }

        return bogusState(code)
      }

      function handleConstructs(list: any) {
        constructs = list
        multiple = 'length' in constructs
        hookIndex = 0
        currentConstruct = multiple ? constructs[hookIndex] : constructs
        return handleConstruct(currentConstruct)
      }

      function handleConstruct(construct: any) {
        return start

        function start(code: any) {
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
          info = store(construct)

          if (!construct.partial) {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'currentConstruct' does not exist on type... Remove this comment to see the full error message
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

      function ok(code: any) {
        assert.equal(code, expectedCode, 'expected code')
        consumed = true
        onreturn(currentConstruct, info)
        return returnState
      }

      function nok(code: any) {
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

  function addResult(construct: any, from: any) {
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
    var startPoint = now()
    var startIndex = index
    var startBufferIndex = bufferIndex
    var startPrevious = context.previous
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'currentConstruct' does not exist on type... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'currentConstruct' does not exist on type... Remove this comment to see the full error message
      context.currentConstruct = startCurrentConstruct
      context.events.length = startEventsIndex
      stack = startStack
    }
  }
}
