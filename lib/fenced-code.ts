import {__generator as tslib__generator} from 'tslib'
import {consume, next, reconsume, switchContext} from './actions'
import {carriageReturn, eof, graveAccent, lineFeed, space, tab, tilde} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxOpeningSequenceSize = 3
const minMarkerSize = 3

export interface ContextInfo {
  safePlace: Place
  temporaryBuffer: string
  size: number
  marker: undefined | 126 /* tilde */ | 96 /* graveAccent */
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

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [OPENING_SEQUENCE_STATE]: openingSequenceState,
  [OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [CONTENT_STATE]: contentState,
  [CLOSING_SEQUENCE_BEFORE_STATE]: closingSequenceBeforeState,
  [CLOSING_SEQUENCE_STATE]: closingSequenceState,
  [CLOSING_SEQUENCE_AFTER_STATE]: closingSequenceAfterState,
  [BOGUS_STATE]: bogusState
}

// Fenced code blocks. Including but not limited to:
//
// ```
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
// ``````

function* startState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  // Exit immediately if this can’t be a fenced code block.
  switch (code) {
    case space:
    case graveAccent:
    case tilde:
      const {line, column, offset, virtualColumn} = tokenizer

      tokenizer.contextInfo = {
        safePlace: {line, column, offset, virtualColumn},
        temporaryBuffer: '',
        size: 0,
        marker: undefined,
        openingSequenceBefore: undefined,
        openingSequence: undefined,
        openingSequenceAfter: undefined,
        content: undefined,
        closingSequenceBefore: undefined,
        closingSequence: undefined,
        closingSequenceAfter: undefined
      }

      yield reconsume(OPENING_SEQUENCE_BEFORE_STATE)
      break

    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* openingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const before = info.openingSequenceBefore

  switch (code) {
    case space:
      if (before && tokenizer.offset - before.start.offset === maxOpeningSequenceSize) {
        yield reconsume(BOGUS_STATE)
        break
      }
      if (info.openingSequenceBefore === undefined) {
        info.openingSequenceBefore = {start: tokenizer.now()}
      }
      yield consume()
      break
    case graveAccent:
    case tilde:
      if (before) {
        before.end = tokenizer.now()
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
  const size = info.size

  switch (code) {
    case eof:
      end()
      yield reconsume(END_STATE)
      break
    case lineFeed:
    case carriageReturn:
      if (size < minMarkerSize) {
        yield reconsume(BOGUS_STATE)
      }
      end()
      yield reconsume(CONTENT_STATE)
      break
    case tab:
    case space:
      if (size < minMarkerSize) {
        yield reconsume(BOGUS_STATE)
      }
      end()

      yield reconsume(OPENING_SEQUENCE_AFTER_STATE)
      break
    case graveAccent:
    case tilde:
      start()

      if (info.marker === undefined) {
        info.marker = code
      }
      if (info.marker !== code) {
        yield reconsume(BOGUS_STATE)
      }

      info.size++

      yield consume()
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (sequence === undefined) {
      info.openingSequence = {start: tokenizer.now()}
    }
  }

  function end() {
    if (sequence) {
      sequence.end = tokenizer.now()
    }
  }
}

function* openingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.openingSequenceAfter

  switch (code) {
    case eof:
      end()
      yield reconsume(END_STATE)
      break
    case carriageReturn:
    case lineFeed:
      end()

      yield reconsume(CONTENT_STATE)
      break
    case tab:
    case space:
      start()
      yield consume()
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (after === undefined) {
      info.openingSequenceAfter = {start: tokenizer.now()}
    }
  }

  function end() {
    if (after) {
      after.end = tokenizer.now()
    }
  }
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const content = info.content
  const marker = info.marker

  switch (code) {
    case eof:
      end()
      yield reconsume(END_STATE)
      break
    case marker:
      end()
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    case space:
      end()
      yield reconsume(CLOSING_SEQUENCE_BEFORE_STATE)
      break
    default:
      start()
      yield consume()
      break
  }

  function start() {
    if (content === undefined) {
      info.content = {start: tokenizer.now()}
    }
  }

  function end() {
    if (content) {
      content.end = tokenizer.now()
    }
  }
}

function* closingSequenceBeforeState(tokenizer: TokenizeType<ContextInfo>, code: null | number) {
  const info = tokenizer.contextInfo
  const before = info.closingSequenceBefore
  const marker = info.marker

  switch (code) {
    case eof:
      end()
      yield reconsume(END_STATE)
      break
    case space:
      start()
      yield consume()
      break
    case marker:
      end()
      yield reconsume(CLOSING_SEQUENCE_STATE)
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function start() {
    if (info.closingSequenceBefore === undefined) {
      info.closingSequenceBefore = {start: tokenizer.now()}
    }
  }

  function end() {
    if (before) {
      before.end = tokenizer.now()
    }
  }

  function clear() {
    info.closingSequenceBefore = undefined
  }
}

function* closingSequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const sequence = info.closingSequence
  const marker = info.marker

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      if (sequence && sequence.end && sequence.end.offset - sequence.start.offset < info.size) {
        yield reconsume(BOGUS_STATE)
      }
      yield reconsume(END_STATE)
      break
    case space:
      end()
      if (sequence && sequence.end && sequence.end.offset - sequence.start.offset < info.size) {
        yield reconsume(BOGUS_STATE)
      }
      yield reconsume(CLOSING_SEQUENCE_AFTER_STATE)
      break
    case marker:
      start()
      yield consume()
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function start() {
    if (sequence === undefined) {
      info.closingSequence = {start: tokenizer.now()}
    }
  }

  function end() {
    if (sequence) {
      sequence.end = tokenizer.now()
    }
  }

  function clear() {
    info.closingSequenceBefore = undefined
    info.closingSequence = undefined
  }
}

function* closingSequenceAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo
  const after = info.closingSequenceAfter

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(END_STATE)
      break
    case space:
      start()
      yield consume()
      break
    default:
      clear()
      yield reconsume(CONTENT_STATE)
      break
  }

  function start() {
    if (after === undefined) {
      info.closingSequenceAfter = {start: tokenizer.now()}
    }
  }

  function end() {
    if (after) {
      after.end = tokenizer.now()
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

  Object.assign(tokenizer, contextInfo.safePlace)

  yield next()
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const info = tokenizer.contextInfo

  // tslint:disable-next-line:no-console
  console.log('code fenced: ', info)

  yield consume()

  yield switchContext(tokenizer.returnContext!)
}
