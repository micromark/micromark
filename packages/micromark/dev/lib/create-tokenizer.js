/**
 * @typedef {import('../index.js').ParseContext} ParseContext
 */

/**
 * @typedef {number|null} Code
 *   A character code.
 *
 *   `null` represents the end of the input stream (called eof).
 *   Negative integers are used instead of certain sequences of characters (such
 *   as line endings and tabs).
 *
 * @typedef {Code|string} Chunk
 *   A chunk is either a character code or a slice of a buffer in the form of a
 *   string.
 *
 * @typedef {string} Type
 *   A token type.
 *
 * @typedef {'flow'|'content'|'text'|'string'} ContentType
 *   Enumeration of the content types.
 *   As markdown needs to first parse containers, flow, content completely, and
 *   then later go on to phrasing and such, it needs to be declared on the
 *   tokens.
 *
 * @typedef Point
 *   A location in the document (`line`/`column`/`offset`) and chunk (`_index`,
 *   `_bufferIndex`).
 *
 *   `_bufferIndex` is `-1` when `_index` points to a code chunk and it’s a
 *   non-negative integer when pointing to a string chunk.
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 * @property {number} _index
 * @property {number} _bufferIndex
 *
 * @typedef Token
 *   A token: a span of chunks.
 * @property {Type} type
 * @property {Point} start
 * @property {Point} end
 * @property {Token} [previous]
 *   The previous token in a list of linked tokens
 * @property {Token} [next]
 *   The next token in a list of linked tokens
 * @property {ContentType} [contentType]
 *   Declares a token as having content of a certain type.
 * @property {TokenizeContext} [_tokenizer]
 *   Used when dealing with linked tokens.
 *   A child tokenizer is needed to tokenize them, which is stored on those
 *   tokens.
 * @property {boolean} [_open]
 *   A marker used to parse attention, depending on the characters before
 *   sequences (`**`), the sequence can open, close, both, or none
 * @property {boolean} [_close]
 *   A marker used to parse attention, depending on the characters after
 *   sequences (`**`), the sequence can open, close, both, or none
 * @property {boolean} [_isInFirstContentOfListItem]
 *   A boolean used internally to figure out if a token is in the first content
 *   of a list item construct.
 * @property {boolean} [_container]
 *   A boolean used internally to figure out if a token is a container token.
 * @property {boolean} [_loose]
 *   A boolean used internally to figure out if a list is loose or not.
 * @property {boolean} [_inactive]
 *   A boolean used internally to figure out if a link opening can’t be used
 *   (because links in links are incorrect).
 * @property {boolean} [_balanced]
 *   A boolean used internally to figure out if a link opening is balanced: it’s
 *   not a link opening but has a balanced closing.
 *
 * @typedef {['enter'|'exit', Token, TokenizeContext]} Event
 *   An event is the start or end of a token, as tokens can contain other tokens
 *   but are stored in a flat list.
 *
 * @callback Enter
 *   Open a token.
 * @param {Type} type
 *   Token to enter.
 * @param {Record<string, unknown>} [fields]
 *   Fields to patch on the token
 * @returns {Token}
 *
 * @callback Exit
 *   Close a token.
 * @param {Type} type
 *   Token to close.
 *   Should match the current open token.
 * @returns {Token}
 *
 * @callback Consume
 *   Deal with the character and move to the next.
 * @param {Code} code
 *   Code that was given to the state function
 * @returns {void}
 *
 * @callback Attempt
 *   Attempt deals with several values, and tries to parse according to those
 *   values.
 *   If a value resulted in `ok`, it worked, the tokens that were made are used,
 *   and `returnState` is switched to.
 *   If the result is `nok`, the attempt failed, so we revert to the original
 *   state, and `bogusState` is used.
 * @param {Construct|Construct[]|ConstructRecord} construct
 * @param {State} returnState
 * @param {State} [bogusState]
 * @returns {(code: Code) => void}
 *
 * @typedef Effects
 *   A context object to transition the CommonMark State Machine (CSMS).
 * @property {Enter} enter
 *   Start a new token.
 * @property {Exit} exit
 *   End a started token.
 * @property {Consume} consume
 *   Deal with the character and move to the next.
 * @property {Attempt} attempt
 *   Try to tokenize a construct.
 * @property {Attempt} interrupt
 *   Interrupt is used for stuff right after a line of content.
 * @property {Attempt} lazy
 *   Lazy is used for lines that were not properly preceded by the container.
 * @property {Attempt} check
 *   Attempt, then revert.
 *
 * @callback State
 *   A state function should return another function: the next
 *   state-as-a-function to go to.
 *
 *   But there is one case where they return void: for the eof character code
 *   (at the end of a value).
 *   The reason being: well, there isn’t any state that makes sense, so void
 *   works well.
 *   Practically that has also helped: if for some reason it was a mistake, then
 *   an exception is throw because there is no next function, meaning it
 *   surfaces early.
 * @param {Code} code
 * @returns {State|void}
 *
 * @callback Resolver
 *   A resolver handles and cleans events coming from `tokenize`.
 * @param {Event[]} events
 * @param {TokenizeContext} context
 * @returns {Event[]}
 *
 * @typedef {(this: TokenizeContext, effects: Effects, ok: State, nok: State) => State} Tokenizer
 *   A tokenize function sets up a state machine to handle character codes streaming in.
 *
 * @typedef {(this: TokenizeContext, effects: Effects) => State} Initializer
 *   Like a tokenizer, but without `ok` or `nok`.
 *
 * @typedef {(this: TokenizeContext, effects: Effects) => void} Exiter
 *   Like a tokenizer, but without `ok` or `nok`, and returning void.
 *
 * @typedef {(this: TokenizeContext, code: Code) => boolean} Previous
 *   Guard whether `code` can come before the construct
 *
 * @typedef Construct
 *   An object descibing how to parse a markdown construct.
 * @property {Tokenizer} tokenize
 * @property {Previous} [previous] Guard whether the previous character can come before the construct
 * @property {Construct} [continuation] For containers, a continuation construct.
 * @property {Exiter} [exit] For containers, a final hook.
 * @property {string} [name] Name of the construct, used to toggle constructs off.
 * @property {boolean} [partial=false] Whether this construct represents a partial construct.
 * @property {Resolver} [resolve]
 * @property {Resolver} [resolveTo]
 * @property {Resolver} [resolveAll]
 * @property {boolean} [concrete] Concrete constructs cannot be interrupted (such as fenced code) by deeper containers
 * @property {boolean} [interruptible]
 * @property {boolean} [lazy]
 * @property {'before'|'after'} [add='before'] Whether the construct, when in a `ConstructRecord`, precedes over existing constructs for the same character code.
 *
 * @typedef {Construct & {tokenize: Initializer}} InitialConstruct
 *   Like a construct, but `tokenize` does not accept `ok` or `nok`.
 *
 * @typedef {Record<string, undefined|Construct|Construct[]>} ConstructRecord
 *   Several constructs, mapped from their initial codes.
 *
 * @typedef TokenizeContext
 *   A context object that helps w/ tokenizing markdown constructs.
 * @property {Code} previous The previous code.
 * @property {Code} code
 * @property {boolean} [interrupt]
 * @property {boolean} [lazy]
 * @property {Construct} [currentConstruct]
 * @property {Record<string, unknown> & {_closeFlow?: boolean}} [containerState]
 * @property {Event[]} events
 * @property {ParseContext} parser
 * @property {(token: Pick<Token, 'start'|'end'>) => Chunk[]} sliceStream Get the chunks that span a token.
 * @property {(token: Pick<Token, 'start'|'end'>, expandTabs?: boolean) => string} sliceSerialize Get the original string that spans a token.
 * @property {() => Point} now
 * @property {(value: Point) => void} defineSkip
 * @property {(slice: Chunk[]) => Event[]} write Write a slice of chunks. The eof code (`null`) can be used to signal the end of the stream.
 * @property {boolean} [_gfmTasklistFirstContentOfListItem] Internal boolean
 *   shared with `micromark-extension-gfm-task-list-item` to signal whether the
 *   tokenizer is tokenizing the first content of a list item construct.
 *
 * @typedef Info
 * @property {() => void} restore
 * @property {number} from
 *
 * @callback ReturnHandle
 *   Handle a successful run.
 * @param {Construct} construct
 * @param {Info} info
 * @returns {void}
 */

import assert from 'assert'
import createDebug from 'debug'
import {markdownLineEnding} from 'micromark-util-character'
import {push, splice} from 'micromark-util-chunked'
import {resolveAll} from 'micromark-util-resolve-all'
import {codes} from 'micromark-util-symbol/codes.js'
import {values} from 'micromark-util-symbol/values.js'

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
 * @param {ParseContext} parser
 * @param {InitialConstruct} initialize
 * @param {Omit<Point, '_index'|'_bufferIndex'>} [from]
 * @returns {TokenizeContext}
 */
export function createTokenizer(parser, initialize, from) {
  /** @type {Point} */
  let point = Object.assign(
    from ? Object.assign({}, from) : {line: 1, column: 1, offset: 0},
    {_index: 0, _bufferIndex: -1}
  )
  /** @type {Record<string, number>} */
  const columnStart = {}
  /** @type {Construct[]} */
  const resolveAllConstructs = []
  /** @type {Chunk[]} */
  let chunks = []
  /** @type {Token[]} */
  let stack = []
  /** @type {boolean|undefined} */
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
   * @type {TokenizeContext}
   */
  const context = {
    previous: codes.eof,
    code: codes.eof,
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

  /** @type {TokenizeContext['write']} */
  function write(slice) {
    chunks = push(chunks, slice)

    main()

    // Exit if we’re not done, resolve might change stuff.
    if (chunks[chunks.length - 1] !== codes.eof) {
      return []
    }

    addResult(initialize, 0)

    // Otherwise, resolve, and exit.
    // @ts-expect-error TS can’t handle recursive types.
    context.events = resolveAll(resolveAllConstructs, context.events, context)

    return context.events
  }

  //
  // Tools.
  //

  /** @type {TokenizeContext['sliceSerialize']} */
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs)
  }

  /** @type {TokenizeContext['sliceStream']} */
  function sliceStream(token) {
    return sliceChunks(chunks, token)
  }

  /** @type {TokenizeContext['now']} */
  function now() {
    return Object.assign({}, point)
  }

  /** @type {TokenizeContext['defineSkip']} */
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
    assert(typeof state === 'function', 'expected state')
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

    assert(typeof type === 'string', 'expected string type')
    assert.notStrictEqual(type.length, 0, 'expected non-empty string')
    debug('enter: `%s`', type)

    context.events.push(['enter', token, context])

    stack.push(token)

    return token
  }

  /** @type {Effects['exit']} */
  function exit(type) {
    assert(typeof type === 'string', 'expected string type')
    assert.notStrictEqual(type.length, 0, 'expected non-empty string')

    const token = stack.pop()
    assert(token, 'cannot close w/o open tokens')
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
     * @param {Construct|Construct[]|ConstructRecord} constructs
     * @param {State} returnState
     * @param {State} [bogusState]
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
       * @param {ConstructRecord} map
       * @returns {State}
       */
      function handleMapOfConstructs(map) {
        return start

        /** @type {State} */
        function start(code) {
          const def = code !== null && map[code]
          const all = code !== null && map.null
          const list = [
            // To do: add more extension tests.
            /* c8 ignore next 2 */
            ...(Array.isArray(def) ? def : def ? [def] : []),
            ...(Array.isArray(all) ? all : all ? [all] : [])
          ]

          return handleListOfConstructs(list)(code)
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

        if (list.length === 0) {
          assert(bogusState, 'expected `bogusState` to be given')
          return bogusState
        }

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
            fields ? Object.assign({}, context, fields) : context,
            effects,
            ok,
            nok
          )(code)
        }
      }

      /** @type {State} */
      function ok(code) {
        assert.strictEqual(code, expectedCode, 'expected code')
        consumed = true
        onreturn(currentConstruct, info)
        return returnState
      }

      /** @type {State} */
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
      splice(
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

/**
 * Get the chunks from a slice of chunks in the range of a token.
 *
 * @param {Chunk[]} chunks
 * @param {Pick<Token, 'start'|'end'>} token
 * @returns {Chunk[]}
 */
function sliceChunks(chunks, token) {
  const startIndex = token.start._index
  const startBufferIndex = token.start._bufferIndex
  const endIndex = token.end._index
  const endBufferIndex = token.end._bufferIndex
  /** @type {Chunk[]} */
  let view

  if (startIndex === endIndex) {
    assert(endBufferIndex > -1, 'expected non-negative end buffer index')
    assert(startBufferIndex > -1, 'expected non-negative start buffer index')
    // @ts-expect-error `_bufferIndex` is used on string chunks.
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)]
  } else {
    view = chunks.slice(startIndex, endIndex)

    if (startBufferIndex > -1) {
      // @ts-expect-error `_bufferIndex` is used on string chunks.
      view[0] = view[0].slice(startBufferIndex)
    }

    if (endBufferIndex > 0) {
      // @ts-expect-error `_bufferIndex` is used on string chunks.
      view.push(chunks[endIndex].slice(0, endBufferIndex))
    }
  }

  return view
}

/**
 * Get the string value of a slice of chunks.
 *
 * @param {Chunk[]} chunks
 * @param {boolean} [expandTabs=false]
 * @returns {string}
 */
function serializeChunks(chunks, expandTabs) {
  let index = -1
  /** @type {string[]} */
  const result = []
  /** @type {boolean|undefined} */
  let atTab

  while (++index < chunks.length) {
    const chunk = chunks[index]
    /** @type {string} */
    let value

    if (typeof chunk === 'string') {
      value = chunk
    } else
      switch (chunk) {
        case codes.carriageReturn: {
          value = values.cr

          break
        }

        case codes.lineFeed: {
          value = values.lf

          break
        }

        case codes.carriageReturnLineFeed: {
          value = values.cr + values.lf

          break
        }

        case codes.horizontalTab: {
          value = expandTabs ? values.space : values.ht

          break
        }

        case codes.virtualSpace: {
          if (!expandTabs && atTab) continue
          value = values.space

          break
        }

        default: {
          assert(typeof chunk === 'number', 'expected number')
          // Currently only replacement character.
          value = String.fromCharCode(chunk)
        }
      }

    atTab = chunk === codes.horizontalTab
    result.push(value)
  }

  return result.join('')
}
