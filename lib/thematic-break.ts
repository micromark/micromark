import {__generator as tslib__generator} from 'tslib'
import {consume, reconsume, switchContext} from './actions'
import {
  asterisk,
  carriageReturn,
  dash,
  eof,
  formFeed,
  lineFeed,
  lineTabulation,
  space,
  tab,
  underscore
} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxIndentSize = 3
const minCountSize = 3

interface Token {
  type: string
  value: string
  position: NonNullable<Position>
}

export interface ContextInfo {
  safePlace: Place
  temporaryBuffer: string
  marker?: number
  count: number
  tokens: Token[]
  position: NonNullable<Position>
  indent?: Token
  sequence?: Token
  whiteSpace?: Token
}

export type StateType =
  | 'START_STATE'
  | 'END_STATE'
  | 'BOGUS_STATE'
  | 'THEMATIC_BREAK_INDENT_STATE'
  | 'THEMATIC_BREAK_SEQUENCE_STATE'
  | 'THEMATIC_BREAK_WHITESPACE_STATE'

const START_STATE = 'START_STATE'
const END_STATE = 'END_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const THEMATIC_BREAK_INDENT_STATE = 'THEMATIC_BREAK_INDENT_STATE'
const THEMATIC_BREAK_SEQUENCE_STATE = 'THEMATIC_BREAK_SEQUENCE_STATE'
const THEMATIC_BREAK_WHITESPACE_STATE = 'THEMATIC_BREAK_WHITESPACE_STATE'

// Note that `openingSequenceState` is the last state that can go to bogus.
// After it, we’re sure it’s an ATX heading
export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [BOGUS_STATE]: bogusState,
  [THEMATIC_BREAK_INDENT_STATE]: indentState,
  [THEMATIC_BREAK_SEQUENCE_STATE]: sequenceState,
  [THEMATIC_BREAK_WHITESPACE_STATE]: whiteSpaceState
}

// Thematic breaks.
// Such as:
//
// ```markdown
// ***
// ---
// ___
// ␠***
// ␠␠***
// ␠␠␠***
// _____________________________________
// ␠-␠-␠-
// ␠**  * ** * ** * **
// -␠␠␠␠␠-␠␠␠␠␠-␠␠␠␠␠-
// -␠-␠-␠-␠␠␠
// ```
//
// Thematic breaks are divided into the following segments:
//
// ```markdown
// ␠␠-␠␠-␠␠-␠␠
// ^^^^^^^^^^^ thematic break
//
// ␠␠-␠␠-␠␠-␠␠
// ^^ indent
//   ^ sequence
//    ^^ white space
//      ^ sequence
//       ^^ white space
//         ^ sequence
//          ^^ white space
// ```
function* startState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {line, column, offset, virtualColumn} = tokenizer

  // Exit immediately if this can’t be a thematic break.
  switch (code) {
    case space:
    case asterisk:
    case dash:
    case underscore:
      tokenizer.contextInfo = {
        safePlace: {line, column, offset, virtualColumn},
        temporaryBuffer: '',
        marker: undefined,
        count: 0,
        tokens: [],
        position: {start: tokenizer.now(), end: tokenizer.now()}
      }

      yield reconsume(THEMATIC_BREAK_INDENT_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* indentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  let token = contextInfo.indent

  switch (code) {
    case space:
      // Too much indent.
      if (token && tokenizer.offset - token.position.start.offset === maxIndentSize) {
        yield reconsume(BOGUS_STATE)
        break
      }

      start()
      buffer()
      yield consume()
      break
    case asterisk:
    case dash:
    case underscore:
      end()
      contextInfo.marker = code
      yield reconsume(THEMATIC_BREAK_SEQUENCE_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      token = {type: 'indent', value: '', position: {start: tokenizer.now()}}
      contextInfo.indent = token
      contextInfo.tokens.push(token)
    }
  }

  function buffer() {
    if (token !== undefined && code !== null) {
      const char = String.fromCharCode(code)
      token.value += char
      contextInfo.temporaryBuffer += char
    }
  }

  function end() {
    if (token !== undefined) {
      token.position.end = tokenizer.now()
      contextInfo.indent = undefined
    }
  }
}

function* sequenceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {marker} = contextInfo
  let token = contextInfo.sequence

  switch (code) {
    case marker:
      start()
      buffer()
      yield consume()
      contextInfo.count++
      break
    // White space except for newlines.
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      end()
      yield reconsume(THEMATIC_BREAK_WHITESPACE_STATE)
      break
    case eof:
    case lineFeed:
    case carriageReturn:
      end()
      yield reconsume(contextInfo.count < minCountSize ? BOGUS_STATE : END_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      token = {type: 'sequence', value: '', position: {start: tokenizer.now()}}
      contextInfo.sequence = token
      contextInfo.tokens.push(token)
    }
  }

  function buffer() {
    if (token !== undefined && code !== null) {
      const char = String.fromCharCode(code)
      token.value += char
      contextInfo.temporaryBuffer += char
    }
  }

  function end() {
    if (token !== undefined) {
      token.position.end = tokenizer.now()
      contextInfo.sequence = undefined
    }
  }
}

function* whiteSpaceState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  let token = contextInfo.whiteSpace

  switch (code) {
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      start()
      buffer()
      yield consume()
      break
    default:
      end()
      yield reconsume(THEMATIC_BREAK_SEQUENCE_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      token = {type: 'whiteSpace', value: '', position: {start: tokenizer.now()}}
      contextInfo.whiteSpace = token
      contextInfo.tokens.push(token)
    }
  }

  function buffer() {
    if (token !== undefined && code !== null) {
      const char = String.fromCharCode(code)
      token.value += char
      contextInfo.temporaryBuffer += char
    }
  }

  function end() {
    if (token !== undefined) {
      token.position.end = tokenizer.now()
      contextInfo.whiteSpace = undefined
    }
  }
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!

  // Todo: use the temporary buffer if we start dropping characters.
  Object.assign(tokenizer, contextInfo.safePlace)
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  contextInfo.position.end = tokenizer.now()

  // tslint:disable-next-line:no-console
  console.log('thematic break:', {
    type: 'thematicBreak',
    children: contextInfo.tokens,
    position: contextInfo.position
  })

  yield consume()
  yield switchContext(tokenizer.returnContext!)
}
