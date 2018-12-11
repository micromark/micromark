import { consume, next, reconsume, switchContext } from './actions'
import * as c from './characters'
import { ContextHandler, Position, TokenizeType } from './types'

const maxOpeningSequenceBeforeSize = 3
const maxOpeningSequenceSize = 6

const T_SPACE = 'space'

type ParsingLocation = { start: Position; end?: Position } | null

interface TokenType {
  type: string
  position: NonNullable<ParsingLocation>
}

export interface ContextInfo {
  token: TokenType
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

export enum StateType {
  START_STATE = 'START_STATE',
  END_STATE = 'END_STATE',
  BOGUS_STATE = 'BOGUS_STATE',
  OPENING_SEQUENCE_BEFORE_STATE = 'OPENING_SEQUENCE_BEFORE_STATE',
  OPENING_SEQUENCE_STATE = 'OPENING_SEQUENCE_STATE',
  OPENING_SEQUENCE_AFTER_STATE = 'OPENING_SEQUENCE_AFTER_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  CLOSING_SEQUENCE_BEFORE_STATE = 'CLOSING_SEQUENCE_BEFORE_STATE',
  CLOSING_SEQUENCE_STATE = 'CLOSING_SEQUENCE_STATE',
  CLOSING_SEQUENCE_AFTER_STATE = 'CLOSING_SEQUENCE_AFTER_STATE'
}

export const contextHandler: ContextHandler<StateType> = {
  [StateType.START_STATE]: startState,
  [StateType.END_STATE]: endState,
  [StateType.BOGUS_STATE]: bogusState,
  [StateType.OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [StateType.OPENING_SEQUENCE_STATE]: openingSequenceState,
  [StateType.OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [StateType.CONTENT_STATE]: contentState,
  [StateType.CLOSING_SEQUENCE_BEFORE_STATE]: closingSequenceBeforeState,
  [StateType.CLOSING_SEQUENCE_STATE]: closingSequenceState,
  [StateType.CLOSING_SEQUENCE_AFTER_STATE]: closingSequenceAfterState
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
  const info = tokenizer.contextInfo

  info.tokens = []
  info.rank = 0
  info.initial = tokenizer.offset
  info.openingSequenceBefore = null
  info.openingSequence = null
  info.openingSequenceAfter = null
  info.content = null
  info.closingSequenceBefore = null
  info.closingSequence = null
  info.closingSequenceAfter = null

  yield reconsume(StateType.OPENING_SEQUENCE_BEFORE_STATE)
}

function* openingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  let tail = info.token

  switch (code) {
    case c.space:
      if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
        yield reconsume(StateType.BOGUS_STATE)
        break
      }
      if (!tail) {
        tail = { type: T_SPACE, position: { start: tokenizer.now() } }
        info.token = tail
        info.tokens.push(tail)
      }

      yield consume()
      break
    case c.numberSign:
      if (tail) {
        tail.position.end = tokenizer.now()
      }

      yield reconsume(StateType.OPENING_SEQUENCE_STATE)
      break
    default:
      yield reconsume(StateType.BOGUS_STATE)
      break
  }
}

function* openingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.openingSequence

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }
      yield reconsume(StateType.END_STATE)
      break
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      yield reconsume(StateType.OPENING_SEQUENCE_AFTER_STATE)
      break
    case c.numberSign:
      if (info.rank === maxOpeningSequenceSize) {
        yield reconsume(StateType.BOGUS_STATE)
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
      yield reconsume(StateType.BOGUS_STATE)
      break
  }
}

function* openingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.openingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(StateType.END_STATE)
      break
    case c.tab:
    case c.space:
      if (after === null) {
        info.openingSequenceAfter = { start: tokenizer.now() }
      }

      yield consume()
      break
    case c.numberSign:
      if (after) {
        after.end = tokenizer.now()
      }

      // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
      // switches back.
      yield reconsume(StateType.CLOSING_SEQUENCE_STATE)
      break
    default:
      if (after) {
        after.end = tokenizer.now()
      }

      yield reconsume(StateType.CONTENT_STATE)
      break
  }
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const content = info.content

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(StateType.END_STATE)
      break
    case c.space:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(StateType.CLOSING_SEQUENCE_BEFORE_STATE)
      break
    case c.numberSign:
      if (content) {
        content.end = tokenizer.now()
      }

      yield reconsume(StateType.CLOSING_SEQUENCE_STATE)
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
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (before) {
        before.end = tokenizer.now()
      }

      yield reconsume(StateType.END_STATE)
      break
    case c.tab:
    case c.space:
      if (info.closingSequenceBefore === null) {
        info.closingSequenceBefore = { start: tokenizer.now() }
      }

      yield consume()
      break
    case c.numberSign:
      if (before) {
        before.end = tokenizer.now()
      }

      yield reconsume(StateType.CLOSING_SEQUENCE_STATE)
      break
    default:
      info.closingSequenceBefore = null
      yield reconsume(StateType.CONTENT_STATE)
      break
  }
}

function* closingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.closingSequence

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      yield reconsume(StateType.END_STATE)
      break
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      yield reconsume(StateType.CLOSING_SEQUENCE_AFTER_STATE)
      break
    case c.numberSign:
      if (sequence === null) {
        info.closingSequence = { start: tokenizer.now() }
      }

      yield consume()
      break
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      yield reconsume(StateType.CONTENT_STATE)
      break
  }
}

function* closingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.closingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }
      yield reconsume(StateType.END_STATE)
      break
    case c.tab:
    case c.space:
      if (after === null) {
        info.closingSequenceAfter = { start: tokenizer.now() }
      }

      yield consume()
      break
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      info.closingSequenceAfter = null
      yield reconsume(StateType.CONTENT_STATE)
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
