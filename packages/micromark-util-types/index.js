// Tokenize:

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
 */

/**
 * @typedef {'ascii'|'utf8'|'utf-8'|'utf16le'|'ucs2'|'ucs-2'|'base64'|'latin1'|'binary'|'hex'} Encoding
 *   Encodings supported by the buffer class.
 *   This is a copy of the typing from Node, copied to prevent Node globals from
 *   being needed.
 *   Copied from: <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/a2bc1d8/types/node/globals.d.ts#L174>
 *
 * @typedef {string|Uint8Array} Value
 *   Contents of the file.
 *   Can either be text, or a `Buffer` like structure.
 *   This does not directly use type `Buffer`, because it can also be used in a
 *   browser context.
 *   Instead this leverages `Uint8Array` which is the base type for `Buffer`,
 *   and a native JavaScript construct.
 */

/**
 * @typedef _ExtensionFields
 * @property {ConstructRecord} document
 * @property {ConstructRecord} contentInitial
 * @property {ConstructRecord} flowInitial
 * @property {ConstructRecord} flow
 * @property {ConstructRecord} string
 * @property {ConstructRecord} text
 * @property {{null?: string[]}} disable
 * @property {{null?: Pick<Construct, 'resolveAll'>[]}} insideSpan
 *
 * @typedef _NormalizedExtensionFields
 * @property {Record<string, Construct[]>} document
 * @property {Record<string, Construct[]>} contentInitial
 * @property {Record<string, Construct[]>} flowInitial
 * @property {Record<string, Construct[]>} flow
 * @property {Record<string, Construct[]>} string
 * @property {Record<string, Construct[]>} text
 * @property {{null: string[]}} disable
 * @property {{null: Pick<Construct, 'resolveAll'>[]}} insideSpan
 *
 * @typedef {Record<string, Record<string, unknown>> & Partial<_ExtensionFields>} Extension
 *   A syntax extension changes how markdown is tokenized.
 *   See: <https://github.com/micromark/micromark#syntaxextension>
 *
 * @typedef {Record<string, Record<string, unknown[]>> & _NormalizedExtensionFields} FullNormalizedExtension
 * @typedef {Partial<FullNormalizedExtension>} NormalizedExtension
 *
 * @callback Create
 *   Set up a tokenizer for a content type.
 * @param {Omit<Point, '_index'|'_bufferIndex'>} [from]
 * @returns {TokenizeContext}
 *
 * @typedef ParseOptions
 *   Parse options.
 * @property {Extension[]} [extensions] Array of syntax extensions
 *
 * @typedef ParseContext
 *   A context object that helps w/ parsing markdown.
 * @property {FullNormalizedExtension} constructs
 * @property {Create} content
 * @property {Create} document
 * @property {Create} flow
 * @property {Create} string
 * @property {Create} text
 * @property {string[]} defined List of defined identifiers.
 */

/**
 * @typedef CompileContext
 *   HTML compiler context
 * @property {CompileOptions} options
 *   Configuration passed by the user.
 * @property {(key: string, value?: unknown) => void} setData
 *   Set data into the key-value store.
 * @property {<K extends string>(key: K) => CompileData[K]} getData
 *   Get data from the key-value store.
 * @property {() => void} lineEndingIfNeeded
 *   Output an extra line ending if the previous value wasn’t EOF/EOL.
 * @property {(value: string) => string} encode
 *   Make a value safe for injection in HTML (except w/ `ignoreEncode`).
 * @property {() => void} buffer
 *   Capture some of the output data.
 * @property {() => string} resume
 *   Stop capturing and access the output data.
 * @property {(value: string) => void} raw
 *   Output raw data.
 * @property {(value: string) => void} tag
 *   Output (parts of) HTML tags.
 * @property {TokenizeContext['sliceSerialize']} sliceSerialize
 *   Get the string value of a token
 *
 * @callback Compile
 *   Serialize micromark events as HTML
 * @param {Event[]} events
 * @returns {string}
 *
 * @typedef {(this: CompileContext, token: Token) => void} Handle
 *   Handle one token
 *
 * @typedef {(this: Omit<CompileContext, 'sliceSerialize'>) => void} DocumentHandle
 *   Handle the whole
 *
 * @typedef {Record<Type, Handle> & {null?: DocumentHandle}} Handles
 *   Token types mapping the handles
 *
 * @typedef {Record<string, Record<Type, unknown>> & {enter: Handles, exit: Handles}} NormalizedHtmlExtension
 *
 * @typedef {Partial<NormalizedHtmlExtension>} HtmlExtension
 *   An HTML extension changes how markdown tokens are serialized.
 *
 * @typedef _CompileDataFields
 * @property {boolean} lastWasTag
 * @property {boolean} expectFirstItem
 * @property {boolean} slurpOneLineEnding
 * @property {boolean} slurpAllLineEndings
 * @property {boolean} fencedCodeInside
 * @property {number} fencesCount
 * @property {boolean} flowCodeSeenData
 * @property {boolean} ignoreEncode
 * @property {number} headingRank
 * @property {boolean} inCodeText
 * @property {string} characterReferenceType
 * @property {boolean[]} tightStack
 *
 * @typedef {Record<string, unknown> & Partial<_CompileDataFields>} CompileData
 *
 * @typedef CompileOptions
 *   Compile options
 * @property {'\r'|'\n'|'\r\n'} [defaultLineEnding]
 *   Value to use for line endings not in `doc` (`string`, default: first line
 *   ending or `'\n'`).
 *
 *   Generally, micromark copies line endings (`'\r'`, `'\n'`, `'\r\n'`) in the
 *   markdown document over to the compiled HTML.
 *   In some cases, such as `> a`, CommonMark requires that extra line endings
 *   are added: `<blockquote>\n<p>a</p>\n</blockquote>`.
 * @property {boolean} [allowDangerousHtml=false]
 *   Whether to allow embedded HTML (`boolean`, default: `false`).
 * @property {boolean} [allowDangerousProtocol=false]
 *   Whether to allow potentially dangerous protocols in links and images
 *   (`boolean`, default: `false`).
 *   URLs relative to the current protocol are always allowed (such as,
 *   `image.jpg`).
 *   For links, the allowed protocols are `http`, `https`, `irc`, `ircs`,
 *   `mailto`, and `xmpp`.
 *   For images, the allowed protocols are `http` and `https`.
 * @property {HtmlExtension[]} [htmlExtensions=[]]
 *   Array of HTML extensions
 */

/**
 * @typedef {ParseOptions & CompileOptions} Options
 */

export {}
