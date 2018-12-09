import * as c from './characters'
import { TokenizeType, ContextHandler } from './types'

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

  tokenizer.reconsume(StateType.OPENING_SEQUENCE_BEFORE_STATE)
}

function openingSequenceBeforeState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let tail = info.token

  switch (code) {
    case c.space:
      if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
        return tokenizer.reconsume(StateType.BOGUS_STATE)
      }
      if (!tail) {
        tail = { type: T_SPACE, position: { start: tokenizer.now() } }
        info.token = tail
        info.tokens.push(tail)
      }

      return tokenizer.consume()
    case c.numberSign:
      if (tail) {
        tail.position.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.OPENING_SEQUENCE_STATE)
    default:
      return tokenizer.reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let sequence = info.openingSequence

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (sequence) {
        sequence.end = tokenizer.now()
      }
      return tokenizer.reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.OPENING_SEQUENCE_AFTER_STATE)
    case c.numberSign:
      if (info.rank === maxOpeningSequenceSize) {
        return tokenizer.reconsume(StateType.BOGUS_STATE)
      }
      if (sequence === null) {
        sequence = { start: tokenizer.now() }
        info.openingSequence = sequence
      }

      info.rank++
      return tokenizer.consume()
    default:
      // Any other character is a bogus heading.
      // CommonMark requires a the opening sequence after space.
      return tokenizer.reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceAfterState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let after = info.openingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (after === null) {
        after = { start: tokenizer.now() }
        info.openingSequenceAfter = after
      }

      return tokenizer.consume()
    case c.numberSign:
      if (after) {
        after.end = tokenizer.now()
      }

      // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
      // switches back.
      return tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      if (after) {
        after.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function contentState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let content = info.content

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (content) {
        content.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.END_STATE)
    case c.space:
      if (content) {
        content.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.CLOSING_SEQUENCE_BEFORE_STATE)
    case c.numberSign:
      if (content) {
        content.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      if (content === null) {
        content = { start: tokenizer.now() }
        info.content = content
      }

      return tokenizer.consume()
  }
}

function closingSequenceBeforeState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let before = info.closingSequenceBefore

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (before) {
        before.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (info.closingSequenceBefore === null) {
        before = { start: tokenizer.now() }
        info.closingSequenceBefore = before
      }

      return tokenizer.consume()
    case c.numberSign:
      if (before) {
        before.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
    default:
      info.closingSequenceBefore = null
      return tokenizer.reconsume(StateType.CONTENT_STATE)
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

      return tokenizer.reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (sequence) {
        sequence.end = tokenizer.now()
      }

      return tokenizer.reconsume(StateType.CLOSING_SEQUENCE_AFTER_STATE)
    case c.numberSign:
      if (sequence === null) {
        sequence = { start: tokenizer.now() }
        info.closingSequence = sequence
      }

      return tokenizer.consume()
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      return tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function closingSequenceAfterState(tokenizer: TokenizeType, code: number | null) {
  const info = tokenizer.contextInfo
  let after = info.closingSequenceAfter

  switch (code) {
    case c.eof:
    case c.lineFeed:
    case c.carriageReturn:
      if (after) {
        after.end = tokenizer.now()
      }
      return tokenizer.reconsume(StateType.END_STATE)
    case c.tab:
    case c.space:
      if (after === null) {
        after = { start: tokenizer.now() }
        info.closingSequenceAfter = after
      }

      return tokenizer.consume()
    default:
      info.closingSequenceBefore = null
      info.closingSequence = null
      info.closingSequenceAfter = null
      return tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function bogusState(tokenizer: TokenizeType) {
  const info = tokenizer.contextInfo

  tokenizer.switch(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!
  tokenizer.offset = info.initial
  tokenizer.next()
}

function endState(tokenizer: TokenizeType) {
  const s = tokenizer.contextInfo

  // tslint:disable-next-line:no-console
  console.log('heading: ', s)
  tokenizer.consume()
  tokenizer.switch(tokenizer.returnContext!)
}
