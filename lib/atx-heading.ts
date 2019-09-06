import {__generator as tslib__generator} from 'tslib'
import {consume, reconsume, switchContext} from './actions'
import {carriageReturn, eof, lineFeed, numberSign, space, tab} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxOpeningSequenceBeforeSize = 3
const maxOpeningSequenceSize = 6

export interface ContextInfo {
  safePlace: Place
  temporaryBuffer: string
  rank: number
  openingSequenceBefore?: Position
  openingSequence?: Position
  openingSequenceAfter?: Position
  content?: Position
  closingSequenceBefore?: Position
  closingSequence?: Position
  closingSequenceAfter?: Position
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

// Note that `openingSequenceState` is the last state that can go to bogus.
// After it, we’re sure it’s an ATX heading
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
// ATX headings are divided into the following segments:
//
// ```markdown
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
// ```
function* startState(tokenizer: TokenizeType<ContextInfo>) {
  const {line, column, offset, virtualColumn} = tokenizer

  tokenizer.contextInfo = {
    safePlace: {line, column, offset, virtualColumn},
    temporaryBuffer: '',
    rank: 0,
    openingSequenceBefore: undefined,
    openingSequence: undefined,
    openingSequenceAfter: undefined,
    content: undefined,
    closingSequenceBefore: undefined,
    closingSequence: undefined,
    closingSequenceAfter: undefined
  }

  yield reconsume(OPENING_SEQUENCE_BEFORE_STATE)
}

function* openingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.openingSequenceBefore

  switch (code) {
    case space:
      // Too much indent.
      if (token && tokenizer.offset - token.start.offset === maxOpeningSequenceBeforeSize) {
        yield reconsume(BOGUS_STATE)
        break
      }

      start()
      buffer()
      yield consume()
      break
    case tab:
      yield reconsume(BOGUS_STATE)
      break
    case numberSign:
      end()
      yield reconsume(OPENING_SEQUENCE_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      info.openingSequenceBefore = {start: tokenizer.now()}
    }
  }

  function buffer() {
    if (code !== null) {
      info.temporaryBuffer += String.fromCharCode(code)
    }
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }
}

function* openingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.openingSequence

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      end()
      yield reconsume(OPENING_SEQUENCE_AFTER_STATE)
      break
    case numberSign:
      if (info.rank === maxOpeningSequenceSize) {
        yield reconsume(BOGUS_STATE)
        break
      }

      start()
      buffer()
      info.rank++
      yield consume()
      break
    default:
      // Any other character is a bogus heading.
      // CommonMark requires a space after the opening sequence.
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      info.openingSequence = {start: tokenizer.now()}
    }
  }

  function buffer() {
    if (code !== null) {
      info.temporaryBuffer += String.fromCharCode(code)
    }
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }
}

function* openingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.openingSequenceAfter

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      start()
      yield consume()
      break
    case numberSign:
      end()
      // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
      // switches back.
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      end()
      yield reconsume(CONTENT_STATE)
      break
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }

  function start() {
    if (token === undefined) {
      info.openingSequenceAfter = {start: tokenizer.now()}
    }
  }
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.content

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case space:
      end()
      yield reconsume(CLOSING_SEQUENCE_BEFORE_STATE)
      break
    case numberSign:
      end()
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      start()
      yield consume()
      break
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }

  function start() {
    if (token === undefined) {
      info.content = {start: tokenizer.now()}
    }
  }
}

function* closingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.closingSequenceBefore

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      start()
      yield consume()
      break
    case numberSign:
      end()
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }

  function start() {
    if (token === undefined) {
      info.closingSequenceBefore = {start: tokenizer.now()}
    }
  }

  function clear() {
    info.closingSequenceBefore = undefined
  }
}

function* closingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.closingSequence

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      end()
      yield reconsume(CLOSING_SEQUENCE_AFTER_STATE)
      break
    case numberSign:
      start()
      yield consume()
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }

  function start() {
    if (token === undefined) {
      info.closingSequence = {start: tokenizer.now()}
    }
  }

  function clear() {
    info.closingSequenceBefore = undefined
    info.closingSequence = undefined
  }
}

function* closingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const token = info.closingSequenceAfter

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case tab:
    case space:
      start()
      yield consume()
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function end() {
    if (token !== undefined) {
      token.end = tokenizer.now()
    }
  }

  function start() {
    if (token === undefined) {
      info.closingSequenceAfter = {start: tokenizer.now()}
    }
  }

  function clear() {
    info.closingSequenceBefore = undefined
    info.closingSequence = undefined
    info.closingSequenceAfter = undefined
  }
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!

  // Todo: use the temporary buffer if we start dropping characters.
  Object.assign(tokenizer, contextInfo.safePlace)
  // yield next()
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  // tslint:disable-next-line:no-console
  console.log('heading:', contextInfo)

  yield consume()
  yield switchContext(tokenizer.returnContext!)
}
