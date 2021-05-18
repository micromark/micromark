/**
 * @typedef {import('../types.js').Parser} Parser
 * @typedef {import('../types.js').Tokenizer} Tokenizer
 * @typedef {import('../types.js').Effects} Effects
 * @typedef {import('../types.js').ConstructObject} ConstructObject
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Initializer} Initializer
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Okay} Okay
 * @typedef {import('../types.js').NotOkay} NotOkay
 * @typedef {import('../types.js').Chunk} Chunk
 * @typedef {import('../types.js').Event} Event
 * @typedef {import('../types.js').Token} Token
 * @typedef {import('../types.js').Point} Point
 * @typedef {import('../types.js').Code} Code
 */

/**
 * @typedef Info
 * @property {() => void} restore
 * @property {number} from
 */

/**
 * Handle a successful run.
 *
 * @callback ReturnHandle
 * @param {Construct} construct
 * @param {Info} info
 * @returns {void}
 */

import assert from 'assert'
import createDebug from 'debug'
import {assign} from '../constant/assign.js'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {chunkedPush} from './chunked-push.js'
import {chunkedSplice} from './chunked-splice.js'
import {resolveAll} from './resolve-all.js'
import {serializeChunks} from './serialize-chunks.js'
import {shallow} from './shallow.js'
import {sliceChunks} from './slice-chunks.js'

const debug = createDebug('micromark')

/**
 * Create a tokenizer.
 * Tokenizers deal with one type of data (e.g., containers, flow, text).
 * The parser is the object dealing with it all.
 * `initialize` works like other constructs, except that only its `tokenize`
 * function is used, in which case it doesn’t receive an `ok` or `nok`.
 * `from` can be given to set the point before the first character, although
 * when further lines are indented, they must be set with `defineSkip`.
 *
 * @param {Parser} parser
 * @param {Initializer} initialize
 * @param {Point} [from]
 * @returns {Tokenizer}
 */
export function createTokenizer(parser, initialize, from) {
  /** @type {Point} */
  let point = assign(from ? shallow(from) : {line: 1, column: 1, offset: 0}, {
    _index: 0,
    _bufferIndex: -1
  })
  /** @type {Record<string, number>} */
  const columnStart = {}
  /** @type {Construct[]} */
  const resolveAllConstructs = []
  /** @type {Chunk[]} */
  let chunks = []
  /** @type {Token[]} */
  let stack = []
  let consumed = true

  /**
   * Tools used for tokenizing.
   *
   * @type {Effects}
   */
  const effects = {
    consume,
    enter,
    exit,
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    interrupt: constructFactory(onsuccessfulcheck, {interrupt: true}),
    lazy: constructFactory(onsuccessfulcheck, {lazy: true})
  }

  /**
   * State and tools for resolving and serializing.
   *
   * @type {Tokenizer}
   */
  const context = {
    previous: codes.eof,
    code: codes.eof,
    currentConstruct: undefined,
    interrupt: false,
    lazy: false,
    containerState: {},
    events: [],
    parser,
    sliceStream,
    sliceSerialize,
    now,
    defineSkip,
    write
  }

  /**
   * The state function.
   *
   * @type {State|void}
   */
  let state = initialize.tokenize.call(context, effects)

  /**
   * Track which character we expect to be consumed, to catch bugs.
   *
   * @type {Code}
   */
  let expectedCode

  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize)
  }

  return context

  /** @type {Tokenizer['write']} */
  function write(slice) {
    chunks = chunkedPush(chunks, slice)

    main()

    // Exit if we’re not done, resolve might change stuff.
    if (chunks[chunks.length - 1] !== codes.eof) {
      return []
    }

    addResult(initialize, 0)

    // Otherwise, resolve, and exit.
    context.events = resolveAll(resolveAllConstructs, context.events, context)

    return context.events
  }

  //
  // Tools.
  //

  /** @type {Tokenizer['sliceSerialize']} */
  function sliceSerialize(token) {
    return serializeChunks(sliceStream(token))
  }

  /** @type {Tokenizer['sliceStream']} */
  function sliceStream(token) {
    return sliceChunks(chunks, token)
  }

  /** @type {Tokenizer['now']} */
  function now() {
    return shallow(point)
  }

  /** @type {Tokenizer['defineSkip']} */
  function defineSkip(value) {
    columnStart[value.line] = value.column
    accountForPotentialSkip()
    debug('position: define skip: `%j`', point)
  }

  //
  // State management.
  //

  /**
   * Main loop (note that `_index` and `_bufferIndex` in `point` are modified by
   * `consume`).
   * Here is where we walk through the chunks, which either include strings of
   * several characters, or numerical character codes.
   * The reason to do this in a loop instead of a call is so the stack can
   * drain.
   *
   * @returns {void}
   */
  function main() {
    /** @type {number} */
    let chunkIndex

    while (point._index < chunks.length) {
      const chunk = chunks[point._index]

      // If we’re in a buffer chunk, loop through it.
      if (typeof chunk === 'string') {
        chunkIndex = point._index

        if (point._bufferIndex < 0) {
          point._bufferIndex = 0
        }

        while (
          point._index === chunkIndex &&
          point._bufferIndex < chunk.length
        ) {
          go(chunk.charCodeAt(point._bufferIndex))
        }
      } else {
        go(chunk)
      }
    }
  }

  /**
   * Deal with one code.
   *
   * @param {Code} code
   * @returns {void}
   */
  function go(code) {
    assert.strictEqual(consumed, true, 'expected character to be consumed')
    consumed = undefined
    debug('main: passing `%s` to %s', code, state && state.name)
    expectedCode = code
    assert.strictEqual(typeof state, 'function', 'expected state')
    // @ts-expect-error we just asserted it is.
    state = state(code)
  }

  /** @type {Effects['consume']} */
  function consume(code) {
    assert.strictEqual(
      code,
      expectedCode,
      'expected given code to equal expected code'
    )

    debug('consume: `%s`', code)

    assert.strictEqual(
      consumed,
      undefined,
      'expected code to not have been consumed'
    )
    assert(
      code === null
        ? context.events.length === 0 ||
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
    if (point._bufferIndex < 0) {
      point._index++
    } else {
      point._bufferIndex++

      // At end of string chunk.
      // @ts-expect-error Points w/ non-negative `_bufferIndex` reference
      // strings.
      if (point._bufferIndex === chunks[point._index].length) {
        point._bufferIndex = -1
        point._index++
      }
    }

    // Expose the previous character.
    context.previous = code

    // Mark as consumed.
    consumed = true
  }

  /** @type {Effects['enter']} */
  function enter(type, fields) {
    /** @type {Token} */
    // @ts-expect-error Patch instead of assign required fields to help GC.
    const token = fields || {}
    token.type = type
    token.start = now()

    assert.strictEqual(typeof type, 'string', 'expected string type')
    assert.notStrictEqual(type.length, 0, 'expected non-empty string')
    debug('enter: `%s`', type)

    context.events.push(['enter', token, context])

    stack.push(token)

    return token
  }

  /** @type {Effects['exit']} */
  function exit(type) {
    assert.strictEqual(typeof type, 'string', 'expected string type')
    assert.notStrictEqual(type.length, 0, 'expected non-empty string')
    assert.notStrictEqual(stack.length, 0, 'cannot close w/o open tokens')

    const token = stack.pop()
    token.end = now()

    assert.strictEqual(
      type,
      token.type,
      'expected exit token to match current token'
    )

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

  /**
   * Use results.
   *
   * @type {ReturnHandle}
   */
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from)
  }

  /**
   * Discard results.
   *
   * @type {ReturnHandle}
   */
  function onsuccessfulcheck(_, info) {
    info.restore()
  }

  /**
   * Factory to attempt/check/interrupt.
   *
   * @param {ReturnHandle} onreturn
   * @param {Record<string, unknown>} [fields]
   */
  function constructFactory(onreturn, fields) {
    return hook

    /**
     * Handle either an object mapping codes to constructs, a list of
     * constructs, or a single construct.
     *
     * @param {Construct|Construct[]|ConstructObject} constructs
     * @param {Okay} returnState
     * @param {NotOkay} [bogusState]
     * @returns {State}
     */
    function hook(constructs, returnState, bogusState) {
      /** @type {Construct[]} */
      let listOfConstructs
      /** @type {number} */
      let constructIndex
      /** @type {Construct} */
      let currentConstruct
      /** @type {Info} */
      let info

      return Array.isArray(constructs)
        ? /* c8 ignore next 1 */
          handleListOfConstructs(constructs)
        : 'tokenize' in constructs
        ? // @ts-expect-error Looks like a construct.
          handleListOfConstructs([constructs])
        : handleMapOfConstructs(constructs)

      /**
       * Handle a list of construct.
       *
       * @param {ConstructObject} map
       * @returns {State}
       */
      function handleMapOfConstructs(map) {
        return start

        /** @type {State} */
        function start(code) {
          if (code in map || codes.eof in map) {
            /** @type {Construct[]} */
            /* c8 ignore next 3 */
            // @ts-expect-error `concat` spreads.
            const list = map.null
              ? [].concat(map[code] || [], map.null)
              : map[code]
            return handleListOfConstructs(list)(code)
          }

          return bogusState(code)
        }
      }

      /**
       * Handle a list of construct.
       *
       * @param {Construct[]} list
       * @returns {State}
       */
      function handleListOfConstructs(list) {
        listOfConstructs = list
        constructIndex = 0
        return handleConstruct(list[constructIndex])
      }

      /**
       * Handle a single construct.
       *
       * @param {Construct} construct
       * @returns {State}
       */
      function handleConstruct(construct) {
        return start

        /** @type {State} */
        function start(code) {
          // To do: not needed to store if there is no bogus state, probably?
          // Currently doesn’t work because `inspect` in document does a check
          // w/o a bogus, which doesn’t make sense. But it does seem to help perf
          // by not storing.
          info = store()
          currentConstruct = construct

          if (!construct.partial) {
            context.currentConstruct = construct
          }

          if (
            construct.name &&
            context.parser.constructs.disable.null.includes(construct.name)
          ) {
            return nok(code)
          }

          return construct.tokenize.call(
            fields ? assign({}, context, fields) : context,
            effects,
            ok,
            nok
          )(code)
        }
      }

      /** @type {Okay} */
      function ok(code) {
        assert.strictEqual(code, expectedCode, 'expected code')
        consumed = true
        onreturn(currentConstruct, info)
        return returnState
      }

      /** @type {NotOkay} */
      function nok(code) {
        assert.strictEqual(code, expectedCode, 'expected code')
        consumed = true
        info.restore()

        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex])
        }

        return bogusState
      }
    }
  }

  /**
   * @param {Construct} construct
   * @param {number} from
   * @returns {void}
   */
  function addResult(construct, from) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
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
      construct.partial ||
        context.events.length === 0 ||
        context.events[context.events.length - 1][0] === 'exit',
      'expected last token to end'
    )
  }

  /**
   * Store state.
   *
   * @returns {Info}
   */
  function store() {
    const startPoint = now()
    const startPrevious = context.previous
    const startCurrentConstruct = context.currentConstruct
    const startEventsIndex = context.events.length
    const startStack = Array.from(stack)

    return {restore, from: startEventsIndex}

    /**
     * Restore state.
     *
     * @returns {void}
     */
    function restore() {
      point = startPoint
      context.previous = startPrevious
      context.currentConstruct = startCurrentConstruct
      context.events.length = startEventsIndex
      stack = startStack
      accountForPotentialSkip()
      debug('position: restore: `%j`', point)
    }
  }

  /**
   * Move the current point a bit forward in the line when it’s on a column
   * skip.
   *
   * @returns {void}
   */
  function accountForPotentialSkip() {
    if (point.line in columnStart && point.column < 2) {
      point.column = columnStart[point.line]
      point.offset += columnStart[point.line] - 1
    }
  }
}
