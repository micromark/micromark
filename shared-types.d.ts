// TypeScript Version: 3.0

/**
 * A location in a string or buffer
 */
export interface Point {
  line: number
  column: number
  offset: number
  _index?: number
  _bufferIndex?: number
}

/**
 * A token type
 *
 * TODO: enumerate token types
 */
export type Type = string

/**
 *
 */
export interface Token {
  type: Type
  start: Point
  end: Point

  previous: Token
  next: Token

  /**
   * Declares a token as having content of a certain type.
   * Because markdown requires to first parse containers, flow, content completely,
   * and then later go on to phrasing and such, it needs to be declared somewhere on the tokens.
   */
  contentType: 'flow' | 'content' | 'string' | 'text'

  // TODO move these to interfaces extending Token, or move these to a `data` property similar to unist (would require code refactor)
  /**
   * Used for whitespace in several places which needs to account for tab stops
   */
  _size?: number

  /**
   * ends with a CR, LF, or CRLF.
   */
  _break?: boolean

  /**
   * Used when dealing with linked tokens. A child tokenizer is needed to tokenize them, which is stored on those tokens
   */
  _tokenizer?: Tokenizer

  /**
   * Used for attention (emphasis, strong).
   *
   * could be (enter emphasis, enter emphasisMarker, exit emphasisMarker, enter strong, enter strongMarker, exit strongMarker, enter data, exit data)
   */
  _events?: Event[]

  /**
   * This is used for tokens that are already “subtokenized”.
   *
   * E.g., when parsing flow, there are content tokens, but those are directly tokenized into definitions/setext/paragraphs
   */
  _subevents?: Event[]

  /**
   * Set to true to mark that a token (e.g., with subevents) is already handled
   */
  _contentTokenized?: boolean

  /**
   * close and open are also used in attention:
   * depending on the characters before and after sequences (**),
   * the sequence can open, close, both, or none
   */
  _open?: boolean

  /**
   * close and open are also used in attention:
   * depending on the characters before and after sequences (**),
   * the sequence can open, close, both, or none
   */
  _close?: boolean
  _marker?: number
  _side?: number

  /**
   * Generally, tabs and spaces behave the same, but in the case of a hard break through trailing spaces ( \n), tabs
   */
  _tabs?: boolean
}

/**
 *
 */
export type Event = [string, Token, unknown]

/**
 * These these are transitions to update the CommonMark State Machine (CSMS)
 */
export interface Effects {
  /**
   * Enter and exit define where tokens start and end
   */
  enter: (type: Type) => void

  /**
   * Enter and exit define where tokens start and end
   */
  exit: (type: Type) => void

  /**
   * Consume deals with a character, and moves to the next
   */
  consume: (code: number) => void

  /**
   * Attempt deals with several values, and tries to parse according to those values.
   * If a value resulted in `ok`, it worked, the tokens that were made are used,
   * and `returnState` is switched to.
   * If the result is `nok`, the attempt failed,
   * so we revert to the original state, and `bogusState` is used.
   */
  attempt: (
    notSureWhatThisIs:
      | Construct
      | Construct[]
      | {[code: number]: Construct | Construct[]},
    returnState: unknown,
    bogusState?: unknown
  ) => (code: number) => void

  /**
   * interrupt is used for stuff right after a line of content.
   */
  interrupt: (
    notSureWhatThisIs:
      | Construct
      | Construct[]
      | {[code: number]: Construct | Construct[]},
    ok: Okay,
    nok?: NotOkay
  ) => (code: number) => void

  check: (
    notSureWhatThisIs:
      | Construct
      | Construct[]
      | {[code: number]: Construct | Construct[]},
    ok: Okay,
    nok?: NotOkay
  ) => (code: number) => void

  /**
   * lazy is used for lines that were not properly preceded by the container.
   */
  lazy: (notSureWhatThisIs:
    | Construct
    | Construct[]
    | {[code: number]: Construct | Construct[]},
  ok: Okay,
  nok?: NotOkay) => void
}

/**
 *
 */
export type Okay = (code: number) => () => void

/**
 *
 */
export type NotOkay = Okay

/**
 *
 */
export interface Tokenizer {
  previous: Token
  events: Event[]
  parser: Parser
  sliceStream: (token: Token) => string[]
  sliceSerialize: (token: Token) => string
  now: () => Point
  defineSkip: (value: Point) => void
  write: (value: number) => Event[]
}

export type Construct = unknown

/**
 *
 */
export interface Parser {
  hooks: {
    [key: string]: Construct | Construct[]
  }
  flow: (something: unknown) => unknown
  defined: unknown[]
}

/**
 *
 */
export interface TokenizerThis {
  events: Event[]
  interrupt: unknown
  lazy: unknown
  containerState: {
    marker: number
    type: Type
    initialBlankLine: unknown
    size: number
    _closeFlow: unknown
    furtherBlankLines: unknown
  }
}
