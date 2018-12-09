import * as c from './characters'
import { TokenizeType, ContextHandler } from './types'
import { consume, reconsume, next } from './actions'

const maxOpeningSequenceBeforeSize = 3
const maxOpeningSequenceSize = 6

const T_SPACE = 'space'

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
function startState(tokenizer: TokenizeType) {
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

  return reconsume(StateType.OPENING_SEQUENCE_BEFORE_STATE)
}

function openingSequenceBeforeState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let tail = info.token

  switch (code) {
    case c.space:
      if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
        return reconsume(StateType.BOGUS_STATE)
      }
      if (!tail) {
        tail = { type: T_SPACE, position: { start: tokenizer.now() } }
        info.token = tail
        info.tokens.push(tail)
      }

      return consume()
    case c.numberSign:
      if (tail) {
        tail.position.end = tokenizer.now()
      }

      return reconsume(StateType.OPENING_SEQUENCE_STATE)
    default:
      return reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.openingSequence

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }
      return reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      return reconsume(StateType.OPENING_SEQUENCE_AFTER_STATE)
    case c.numberSign:
      if (info.rank === maxOpeningSequenceSize) {
        return reconsume(StateType.BOGUS_STATE)
      }
      if (sequence === null) {
        info.openingSequence = { start: tokenizer.now() }
      }

      info.rank++
      return consume()
    default:
      // Any other character is a bogus heading.
      // CommonMark requires a the opening sequence after space.
      return reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceAfterState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.openingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }

      return reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (after === null) {
        info.openingSequenceAfter = { start: tokenizer.now() }
      }

      return consume()
    case c.numberSign:
      if (after) {
        after.end = tokenizer.now()
      }

      // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
      // switches back.
      return reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      if (after) {
        after.end = tokenizer.now()
      }

      return reconsume(StateType.CONTENT_STATE)
  }
}

function contentState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  const content = info.content

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (content) {
        content.end = tokenizer.now()
      }

      return reconsume(StateType.END_STATE)
    case c.space:
      if (content) {
        content.end = tokenizer.now()
      }

      return reconsume(StateType.CLOSING_SEQUENCE_BEFORE_STATE)
    case c.numberSign:
      if (content) {
        content.end = tokenizer.now()
      }

      return reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      if (content === null) {
        info.content = { start: tokenizer.now() }
      }

      return consume()
  }
}

function closingSequenceBeforeState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  const before = info.closingSequenceBefore

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (before) {
        before.end = tokenizer.now()
      }

      return reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (info.closingSequenceBefore === null) {
        info.closingSequenceBefore = { start: tokenizer.now() }
      }

      return consume()
    case c.numberSign:
      if (before) {
        before.end = tokenizer.now()
      }

      return reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      info.closingSequenceBefore = null
      return reconsume(StateType.CONTENT_STATE)
  }
}

function closingSequenceState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let sequence = info.closingSequence

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      return reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      return reconsume(StateType.CLOSING_SEQUENCE_AFTER_STATE)
    case c.numberSign:
      if (sequence === null) {
        sequence = { start: tokenizer.now() }
        info.closingSequence = sequence
      }

      return consume()
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      return reconsume(StateType.CONTENT_STATE)
  }
}

function closingSequenceAfterState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.closingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }
      return reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (after === null) {
        info.closingSequenceAfter = { start: tokenizer.now() }
      }

      return consume()
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      info.closingSequenceAfter = null
      return reconsume(StateType.CONTENT_STATE)
  }
}

function bogusState(tokenizer: TokenizeType) {
  const info = tokenizer.contextInfo

  tokenizer.switch(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!
  tokenizer.offset = info.initial
  return next()
}

function endState(tokenizer: TokenizeType) {
  const s = tokenizer.contextInfo

  // tslint:disable-next-line:no-console
  console.log('heading: ', s)

  // TODO This has been temporarily move to before "consume"
  tokenizer.switch(tokenizer.returnContext!)

  return consume()
}
