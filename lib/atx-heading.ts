import { __generator as tslib__generator } from 'tslib'
import { consume, next, reconsume, switchContext } from './actions'
import { carriageReturn, eof, lineFeed, numberSign, space, tab } from './characters'
import { ContextHandler, Position, TokenizeType } from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxOpeningSequenceBeforeSize = 3
const maxOpeningSequenceSize = 6

const T_SPACE = 'space'

type ParsingLocation = { start: Position; end?: Position } | null

interface TokenType {
  type: string
  position: NonNullable<ParsingLocation>
}

export interface ContextInfo {
  token?: TokenType
  tokens: TokenType[]
  rank: number
  initial: number
  openingSequenceBefore: ParsingLocation // TODO find out why this is needed
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
  | 'CLOSING_SEQUENCE_BEFORE_STATE'
  | 'CLOSING_SEQUENCE_STATE'
  | 'CLOSING_SEQUENCE_AFTER_STATE'

const START_STATE = 'START_STATE'
const END_STATE = 'END_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const OPENING_SEQUENCE_BEFORE_STATE = 'OPENING_SEQUENCE_BEFORE_STATE'
const OPENING_SEQUENCE_STATE = 'OPENING_SEQUENCE_STATE'
const OPENING_SEQUENCE_AFTER_STATE = 'OPENING_SEQUENCE_AFTER_STATE'
const CONTENT_STATE = 'CONTENT_STATE'
const CLOSING_SEQUENCE_BEFORE_STATE = 'CLOSING_SEQUENCE_BEFORE_STATE'
const CLOSING_SEQUENCE_STATE = 'CLOSING_SEQUENCE_STATE'
const CLOSING_SEQUENCE_AFTER_STATE = 'CLOSING_SEQUENCE_AFTER_STATE'

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [BOGUS_STATE]: bogusState,
  [OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [OPENING_SEQUENCE_STATE]: openingSequenceState,
  [OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [CONTENT_STATE]: contentState,
  [CLOSING_SEQUENCE_BEFORE_STATE]: closingSequenceBeforeState,
  [CLOSING_SEQUENCE_STATE]: closingSequenceState,
  [CLOSING_SEQUENCE_AFTER_STATE]: closingSequenceAfterState
}

// ATX heading. Such as:
//
// ```markdown
// ␠# Hello
// #
// # Hello
// ## Hello
// #␠␠Hello
// # Hello # World
// # Hello␠␠
// # Hello #
// # Hello # World #
// # Hello #␠␠
// # Hello␠␠#␠␠
// # Hello #########
// ```
//
// ␠␠␠###␠␠␠foo␠␠␠###␠␠␠
// ^^^^^^^^^^^^^^^^^^^^^ heading
//
// ␠␠␠###␠␠␠foo␠␠␠###␠␠␠
// ^^^^^^^^^ opening
//          ^^^ value
//     closing ^^^^^^^^^
//
// ␠␠␠###␠␠␠
// ^^^ before
//    ^^^ value
// after ^^^
function* startState(tokenizer: TokenizeType<ContextInfo>) {
  tokenizer.contextInfo = {
    tokens: [],
    rank: 0,
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
    case numberSign:
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
    case numberSign:
      if (info.rank === maxOpeningSequenceSize) {
        yield reconsume(BOGUS_STATE)
        break
      }
      if (sequence === null) {
        info.openingSequence = { start: tokenizer.now() }
      }

      info.rank++
      yield consume()
      break
    default:
      // Any other character is a bogus heading.
      // CommonMark requires a the opening sequence after space.
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* openingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.openingSequenceAfter

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      if (after === null) {
        info.openingSequenceAfter = { start: tokenizer.now() }
      }

      yield consume()
      break
    case numberSign:
      if (after) {
        after.end = tokenizer.now()
      }

      // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
      // switches back.
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(CONTENT_STATE)
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
    case space:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(CLOSING_SEQUENCE_BEFORE_STATE)
      break
    case numberSign:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      if (content === null) {
        info.content = { start: tokenizer.now() }
      }

      yield consume()
      break
  }
}

function* closingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const before = info.closingSequenceBefore

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (before) {
        before.end = tokenizer.now()
      }

      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      if (info.closingSequenceBefore === null) {
        info.closingSequenceBefore = { start: tokenizer.now() }
      }

      yield consume()
      break
    case numberSign:
      if (before) {
        before.end = tokenizer.now()
      }

      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      info.closingSequenceBefore = null
      yield reconsume(CONTENT_STATE)
      break
  }
}

function* closingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.closingSequence

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

      yield reconsume(CLOSING_SEQUENCE_AFTER_STATE)
      break
    case numberSign:
      if (sequence === null) {
        info.closingSequence = { start: tokenizer.now() }
      }

      yield consume()
      break
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      yield reconsume(CONTENT_STATE)
      break
  }
}

function* closingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.closingSequenceAfter

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      if (after === null) {
        info.closingSequenceAfter = { start: tokenizer.now() }
      }

      yield consume()
      break
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      info.closingSequenceAfter = null
      yield reconsume(CONTENT_STATE)
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
  console.log('heading: ', info)

  yield consume()

  yield switchContext(tokenizer.returnContext!)
}
