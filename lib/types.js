/**
 * A character code.
 * `null` represents the end of the input stream (called eof).
 * Negative integers are used instead of certain sequences of characters (such
 * as line endings and tabs).
 *
 * @typedef {number|null} Code
 */

/**
 * A chunk is either a character code or a slice of a buffer in the form of a
 * string.
 *
 * @typedef {NonNullable<Code>|string} Chunk
 */

/**
 * A token type.
 *
 * @typedef {string} Type
 */

/**
 * An event type.
 *
 * @typedef {'enter'|'exit'} EventType
 */

/**
 * Enumeration of the content types.
 * As markdown needs to first parse containers, flow, content completely, and
 * then later go on to phrasing and such, it needs to be declared on the tokens.
 *
 * @typedef {'flow'|'content'|'text'|'string'} ContentType
 */

/**
 * A location in the stream (`line`/`column`/`offset`) and chunk (`_index`,
 * `_bufferIndex`).
 *
 * @typedef Point
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 * @property {number} _index
 * @property {number} _bufferIndex
 */

/**
 * A token: a span of chunks.
 *
 * @typedef Token
 * @property {Type} type
 * @property {Point} start
 * @property {Point} end
 * @property {Token} [previous] The previous token in a list of linked tokens
 * @property {Token} [next] The next token in a list of linked tokens
 * @property {ContentType} [contentType] Declares a token as having content of a
 *   certain type.
 * @property {Tokenizer} [_tokenizer] Used when dealing with linked tokens.
 *   A child tokenizer is needed to tokenize them, which is stored on those
 *   tokens.
 * @property {boolean} [_open] A marker used to parse attention, depending on
 *   the characters before sequences (`**`), the sequence can open, close, both,
 *   or none
 * @property {boolean} [_close] A marker used to parse attention, depending on
 *   the characters after sequences (`**`), the sequence can open, close, both,
 *   or none
 * @property {boolean} [_isInFirstContentOfListItem] A boolean used internally
 *   to figure out if a token is in the first content of a list item construct.
 * @property {boolean} [_container] A boolean used internally to figure out if a
 *   token is a container token.
 * @property {boolean} [_loose] A boolean used internally to figure out if a
 *   list is loose or not.
 * @property {boolean} [_inactive] A boolean used internally to figure out if a
 *   link opening can’t be used (because links in links are incorrect).
 * @property {boolean} [_balanced] A boolean used internally to figure out if a
 *   link opening is balanced: it’s not a link opening but has a balanced
 *   closing.
 */

/**
 * An event is the start or end of a token, as tokens can contain other tokens
 * but are stored in a flat list.
 *
 * @typedef {[EventType, Token, Tokenizer]} Event
 */

/**
 * Enter or exit a token.
 *
 * @callback EnterOrExit
 * @param {Type} type
 * @param {Record<string, unknown>} [fields]
 * @returns {Token}
 */

/**
 * Deal with the character and move to the next.
 *
 * @callback Consume
 * @param {NonNullable<Code>} code
 * @returns {void}
 */

/**
 * Attempt deals with several values, and tries to parse according to those
 * values.
 * If a value resulted in `ok`, it worked, the tokens that were made are used,
 * and `returnState` is switched to.
 * If the result is `nok`, the attempt failed, so we revert to the original
 * state, and `bogusState` is used.
 *
 * @callback Attempt
 * @param {Construct|Construct[]|ConstructObject} constructInfo
 * @param {State} returnState
 * @param {State} [bogusState]
 * @returns {(code: Code) => void}
 */

/**
 * A context object to transition the CommonMark State Machine (CSMS).
 *
 * @typedef Effects
 * @property {EnterOrExit} enter Start a new token.
 * @property {EnterOrExit} exit End a started token.
 * @property {Consume} consume
 * @property {Attempt} attempt Try to tokenize a construct.
 * @property {Attempt} interrupt Interrupt is used for stuff right after a line
 *   of content.
 * @property {Attempt} lazy Lazy is used for lines that were not properly
 *   preceded by the container.
 * @property {Attempt} check Attempt, then revert.
 */

/**
 * A state function should return another function: the next state-as-a-function
 * to go to.
 *
 * But there is one case where they return void: for the eof character code (at
 * the end of a value).
 * The reason being: well, there isn’t any state that makes sense, so void works
 * well.
 * Practically that has also helped: if for some reason it was a mistake, then
 * an exception is throw because there is no next function, meaning it surfaces
 * early.
 *
 * @callback State
 * @param {Code} code
 * @returns {State|void}
 */

/**
 * The state that resolves a construct.
 *
 * @typedef {State} Okay
 */

/**
 * The state that rejects a construct.
 *
 * @typedef {State} NotOkay
 */

/**
 * A resolve function handles and cleans events coming from `tokenize`.
 *
 * @callback Resolve
 * @param {Event[]} events
 * @param {Tokenizer} context
 * @returns {Event[]}
 */

/**
 * A tokenize function sets up a state machine to handle character codes streaming in.
 *
 * @typedef {(this: Tokenizer, effects: Effects, ok: Okay, nok: NotOkay) => State} Tokenize
 */

/**
 * Like a tokenizer, but without `ok` or `nok`.
 *
 * @typedef {(this: Tokenizer, effects: Effects) => State} Initialize
 */

/**
 * Like a tokenizer, but without `ok` or `nok`, and returning void.
 *
 * @typedef {(this: Tokenizer, effects: Effects) => void} Exit
 */

/**
 * @typedef {(this: Tokenizer, code: Code) => boolean} Previous
 */

/**
 * Set up a tokenizer for a content type.
 *
 * @callback Create
 * @param {Point} [from]
 * @returns {Tokenizer}
 */

/**
 * An object descibing how to parse a markdown construct.
 *
 * @typedef Construct
 * @property {Tokenize} tokenize
 * @property {Previous} [previous] An optional check to ensure a given character can come before the construct.
 * @property {Construct} [continuation] For containers, a continuation construct.
 * @property {Exit} [exit] For containers, a final hook.
 * @property {string} [name]
 * @property {boolean} [partial=false] Whether this construct represents a partial construct
 * @property {Resolve} [resolve]
 * @property {Resolve} [resolveTo]
 * @property {Resolve} [resolveAll]
 * @property {boolean} [concrete]
 * @property {boolean} [interruptible]
 * @property {boolean} [lazy]
 * @property {'before'|'after'} [add='before'] Whether the construct, when in a `ConstructObject`, precedes over existing constructs for the same character code.
 */

/**
 * Like a tokenizer, but without `ok` or `nok`.
 *
 * @typedef {Omit<Construct, 'tokenize'> & {tokenize: Initialize}} Initializer
 */

/**
 * Several constructs, mapping from their initial codes.
 *
 * @typedef {Record<string, Construct|Construct[]>} ConstructObject
 */

/**
 * A context object that helps w/ tokenizing markdown constructs.
 *
 * @typedef Tokenizer
 * @property {Code} previous The previous code.
 * @property {Code} code
 * @property {boolean} interrupt
 * @property {boolean} lazy
 * @property {Construct} currentConstruct
 * @property {Record<string, unknown>} containerState
 * @property {Event[]} events
 * @property {Parser} parser
 * @property {(token: Pick<Token, 'start'|'end'>) => Chunk[]} sliceStream
 * @property {(token: Pick<Token, 'start'|'end'>) => string} sliceSerialize
 * @property {() => Point} now
 * @property {(value: Point) => void} defineSkip
 * @property {(slice: Chunk[]) => Event[]} write Write a slice of chunks.
 * @property {boolean} [_gfmTasklistFirstContentOfListItem] Internal boolean
 *   shared with `micromark-extension-gfm-task-list-item` to signal whether the
 *   tokenizer is tokenizing the first content of a list item construct.
 */

/**
 * A context object that helps w/ parsing markdown.
 *
 * @typedef Parser
 * @property {NormalizedConstructs} constructs
 * @property {Create} content
 * @property {Create} document
 * @property {Create} flow
 * @property {Create} string
 * @property {Create} text
 * @property {string[]} defined List of defined identifiers.
 */

/**
 * A syntax extension changes how markdown is tokenized.
 * See: <https://github.com/micromark/micromark#syntaxextension>
 *
 * @typedef Extension
 * @property {ConstructObject} [document]
 * @property {ConstructObject} [contentInitial]
 * @property {ConstructObject} [flowInitial]
 * @property {ConstructObject} [flow]
 * @property {ConstructObject} [string]
 * @property {ConstructObject} [text]
 * @property {{null?: string[]}} [disable]
 * @property {{null?: {resolveAll?: Resolve}[]}} [insideSpan]
 */

/**
 * @typedef {Record<string, Construct[]>} NormalizedConstructObject
 */

/**
 * @typedef NormalizedExtension
 * @property {NormalizedConstructObject} [document]
 * @property {NormalizedConstructObject} [contentInitial]
 * @property {NormalizedConstructObject} [flowInitial]
 * @property {NormalizedConstructObject} [flow]
 * @property {NormalizedConstructObject} [string]
 * @property {NormalizedConstructObject} [text]
 * @property {{null: string[]}} [disable]
 * @property {{null: {resolveAll?: Resolve}[]}} [insideSpan]
 */

/**
 * @typedef {Required<NormalizedExtension>} NormalizedConstructs
 */

/**
 * @typedef {import('./compile/html.js').Handle} Handle
 */

/**
 * An HTML extension changes how markdown tokens are serialized.
 * See: <https://github.com/micromark/micromark#htmlextension>
 *
 * @typedef {{[key: string]: Record<Type, unknown>, enter?: Record<Type, Handle>, exit?: Record<Type, Handle>}} HtmlExtension
 */

export {}
