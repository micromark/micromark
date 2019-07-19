import { __generator as tslib__generator } from 'tslib'
import { consume, next, reconsume, switchContext } from './actions'
import { carriageReturn, eof, graveAccent, lineFeed, space, tab, tilde } from './characters'
import { ContextHandler, Position, TokenizeType } from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxOpeningSequenceBeforeSize = 3
const T_SPACE = 'space'

type ParsingLocation = { start: Position; end?: Position } | null

interface TokenType {
  type: string
  position: NonNullable<ParsingLocation>
}

export interface ContextInfo {
  token?: TokenType
  tokens: TokenType[]
  initial: number
  infoString: { lang: string | null; meta: string | null }
  usesGraveAccent: boolean
  usesTilde: boolean
  openingSequenceBefore: ParsingLocation
  openingSequence: ParsingLocation
  openingSequenceAfter: ParsingLocation
  content: ParsingLocation
  closingSequenceBefore: ParsingLocation
  closingSequence: ParsingLocation
  closingSequenceAfter: ParsingLocation
}

export type StateType =
  | 'START_STATE'
  | 'END_STATE'
  | 'BOGUS_STATE'
  | 'OPENING_SEQUENCE_BEFORE_STATE'
  | 'OPENING_SEQUENCE_STATE'
  | 'OPENING_SEQUENCE_AFTER_STATE'
  | 'CONTENT_STATE'

const START_STATE = 'START_STATE'
const END_STATE = 'END_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const OPENING_SEQUENCE_BEFORE_STATE = 'OPENING_SEQUENCE_BEFORE_STATE'
const OPENING_SEQUENCE_STATE = 'OPENING_SEQUENCE_STATE'
const OPENING_SEQUENCE_AFTER_STATE = 'OPENING_SEQUENCE_AFTER_STATE'
const CONTENT_STATE = 'CONTENT_STATE'

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [OPENING_SEQUENCE_STATE]: openingSequenceState,
  [OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [CONTENT_STATE]: contentState,
  [BOGUS_STATE]: bogusState
}

// Fenced code blocks. Including but not limited to:
//
// ```markdown
//
// ```
// foo
// ```
//
// ```js highlight-line="2"
// foo
// bar
// ```
//
//   ~~~
//   foo
//   ~~~
//
// ```
// foo
// ~~~
// ```
//
// ````
// foo
// ```
//
// ``````
//
// ␠␠␠```foo␠␠␠````␠␠␠
// ^^^^^^^^^^^^^^^^^^^^^ fenced code
//

function* startState(tokenizer: TokenizeType<ContextInfo>) {
  tokenizer.contextInfo = {
    tokens: [],
    infoString: { lang: null, meta: null },
    usesGraveAccent: false,
    usesTilde: false,
    initial: tokenizer.offset,
    openingSequenceBefore: null,
    openingSequence: null,
    openingSequenceAfter: null,
    content: null,
    closingSequenceBefore: null,
    closingSequence: null,
    closingSequenceAfter: null
  }

  yield reconsume(OPENING_SEQUENCE_BEFORE_STATE)
}

function* openingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  let tail = info.token

  switch (code) {
    case space:
      if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
        yield reconsume(BOGUS_STATE)
        break
      }
      if (!tail) {
        tail = { type: T_SPACE, position: { start: tokenizer.now() } }
        info.token = tail
        info.tokens.push(tail)
      }
      yield consume()
      break
    case graveAccent:
    case tilde:
      if (tail) {
        tail.position.end = tokenizer.now()
      }

      yield reconsume(OPENING_SEQUENCE_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* openingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.openingSequence

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      yield reconsume(OPENING_SEQUENCE_AFTER_STATE)
      break
    case graveAccent:
      if (sequence === null) {
        info.openingSequence = { start: tokenizer.now() }
      }

      if (code === graveAccent && info.usesTilde) {
        yield reconsume(BOGUS_STATE)
      }

      info.usesGraveAccent = true

      yield consume()
      break
    case tilde:
      if (sequence === null) {
        info.openingSequence = { start: tokenizer.now() }
      }
      if (code === tilde && info.usesGraveAccent) {
        yield reconsume(BOGUS_STATE)
      }

      info.usesTilde = true

      yield consume()
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* openingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.openingSequenceAfter

  switch (code) {
    case eof:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(END_STATE)
      break
    case carriageReturn:
    case lineFeed:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(CONTENT_STATE)
      break
    case tab:
    case space:
      if (after === null) {
        info.openingSequenceAfter = { start: tokenizer.now() }
      }

      yield consume()
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const content = info.content

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(END_STATE)
      break
    default:
      if (content === null) {
        info.content = { start: tokenizer.now() }
      }

      yield consume()
      break
  }
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const info = tokenizer.contextInfo

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!
  tokenizer.offset = info.initial
  yield next()
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const info = tokenizer.contextInfo

  // tslint:disable-next-line:no-console
  console.log('code fenced: ', info)

  yield consume()

  yield switchContext(tokenizer.returnContext!)
}
