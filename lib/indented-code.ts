import {__generator as tslib__generator} from 'tslib'
import {consume, next, reconsume, switchContext} from './actions'
import {carriageReturn, eof, lineFeed, space, tab} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const minOpeningSequenceBeforeSize = 4

interface Token {
  type: string
  value: string
  position: NonNullable<Position>
}

interface LineToken {
  type: string
  blank: boolean
  indentSize: number
  indent?: Token
  content?: Token
  lineEnding?: Token
  position: NonNullable<Position>
}

export interface ContextInfo {
  open: boolean
  safePlace: Place
  lines: LineToken[]
  blanks: LineToken[]
  lineToken?: LineToken
}

export type StateType =
  | 'START_STATE'
  | 'INDENTED_CODE_END_STATE'
  | 'INDENTED_CODE_BOGUS_STATE'
  | 'INDENTED_CODE_BEFORE_LINE_STATE'
  | 'INDENTED_CODE_INDENT_STATE'
  | 'INDENTED_CODE_CONTENT_STATE'
  | 'INDENTED_CODE_LINE_ENDING_STATE'
  | 'INDENTED_CODE_AFTER_LINE_STATE'

const START_STATE = 'START_STATE'
const INDENTED_CODE_BEFORE_LINE_STATE = 'INDENTED_CODE_BEFORE_LINE_STATE'
const INDENTED_CODE_INDENT_STATE = 'INDENTED_CODE_INDENT_STATE'
const INDENTED_CODE_CONTENT_STATE = 'INDENTED_CODE_CONTENT_STATE'
const INDENTED_CODE_LINE_ENDING_STATE = 'INDENTED_CODE_LINE_ENDING_STATE'
const INDENTED_CODE_AFTER_LINE_STATE = 'INDENTED_CODE_AFTER_LINE_STATE'
const INDENTED_CODE_END_STATE = 'INDENTED_CODE_END_STATE'
const INDENTED_CODE_BOGUS_STATE = 'INDENTED_CODE_BOGUS_STATE'

// Note that where there’s a non-blank line, we don’t go to bogus anymore.
// When we have one, we can only end by a EOF or a bogus line, in which case
// we have to backtrack all trailing blank lines.
export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [INDENTED_CODE_BEFORE_LINE_STATE]: beforeLineState,
  [INDENTED_CODE_INDENT_STATE]: indentState,
  [INDENTED_CODE_CONTENT_STATE]: contentState,
  [INDENTED_CODE_LINE_ENDING_STATE]: lineEndingState,
  [INDENTED_CODE_AFTER_LINE_STATE]: afterLineState,
  [INDENTED_CODE_END_STATE]: endState,
  [INDENTED_CODE_BOGUS_STATE]: bogusState
}

// Indented code.
// Such as:
//
// ```markdown
// ␠␠␠␠Alpha
// ```
//
// ```markdown
// ␠␠␠␠
// ```
//
// ```markdown
// ␠␠␠␠Alpha
//
// ␠␠␠␠Bravo
// ```
//
// ```markdown
// ␠␠␠␠Alpha
// ␠␠
// ␠␠␠␠Bravo
// ```
//
// Indented code is divided into chunks:
//
// ```markdown
// ␠␠␠␠Alpha
//
// ␠␠␠␠Bravo
// ```
//
// …where Alpha and Bravo, and their idents, are chunks.
//
// In the case of the following:
//
// ```markdown
// ␠␠␠␠Alpha
// ␠␠
// ␠␠␠␠Bravo
// ```
//
// …the chunks are the same, but there’s also a blank line between.
//
// Chunks contain lines:
//
// ```markdown
// ␠␠␠␠Alpha
// ␠␠␉Bravo
// ```
//
// …both lines are a line, the first with an indent of four literal spaces, the
// second with an indent of two spaces and a horizontal tab (four virtual
// spaces).
//
// Indented code goes on ’till a bogus line (or EOF) is found:
//
// ```markdown
// ␠␠␠␠Alpha
// ␠␠
// Bravo
// ```
//
// …at that point (the B), we backtrack to before the current queue’s first
// blank line, the current queue of blank lines is flushed, and end the code
// there.
function* startState(tokenizer: TokenizeType<ContextInfo>) {
  const {line, column, offset, virtualColumn} = tokenizer

  tokenizer.contextInfo = {
    open: false,
    safePlace: {line, column, offset, virtualColumn},
    lines: [],
    blanks: [],
    lineToken: undefined
  }

  yield reconsume(INDENTED_CODE_BEFORE_LINE_STATE)
}

function* beforeLineState(tokenizer: TokenizeType<ContextInfo>) {
  tokenizer.contextInfo.lineToken = {
    type: 'line',
    blank: true,
    indentSize: 0,
    indent: undefined,
    content: undefined,
    lineEnding: undefined,
    position: {start: tokenizer.now()}
  }

  yield reconsume(INDENTED_CODE_INDENT_STATE)
}

function* indentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo, tabSize} = tokenizer
  const {lineToken} = contextInfo

  if (lineToken === undefined) {
    throw new Error('Start the line before indent')
  }

  if (lineToken.indentSize >= minOpeningSequenceBeforeSize) {
    return yield reconsume(INDENTED_CODE_CONTENT_STATE)
  }

  let token = lineToken.indent

  switch (code) {
    case eof:
      yield reconsume(INDENTED_CODE_AFTER_LINE_STATE)
      break
    case carriageReturn:
    case lineFeed:
      yield reconsume(INDENTED_CODE_LINE_ENDING_STATE)
      break
    case tab:
    case space:
      if (token === undefined) {
        token = {type: 'indent', value: '', position: {start: tokenizer.now()}}
        lineToken.indent = token
      }

      token.value += String.fromCharCode(code)

      if (code === space) {
        lineToken.indentSize++
      } else {
        lineToken.indentSize = Math.floor(lineToken.indentSize / tabSize) * tabSize + tabSize
      }

      yield consume()
      token.position.end = tokenizer.now()

      break
    default:
      yield reconsume(INDENTED_CODE_END_STATE)
      break
  }
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {lineToken} = contextInfo

  if (lineToken === undefined) {
    throw new Error('Start the line before content')
  }

  let token = lineToken.content

  switch (code) {
    case eof:
      yield reconsume(INDENTED_CODE_AFTER_LINE_STATE)
      break
    case carriageReturn:
    case lineFeed:
      yield reconsume(INDENTED_CODE_LINE_ENDING_STATE)
      break
    default:
      if (token === undefined) {
        token = {type: 'content', value: '', position: {start: tokenizer.now()}}
        lineToken.content = token
      }

      if (lineToken.blank === true && (code !== space && code !== tab)) {
        lineToken.blank = false
      }

      token.value += String.fromCharCode(code)

      yield consume()
      token.position.end = tokenizer.now()
      break
  }
}

function* lineEndingState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {lineToken} = contextInfo

  if (lineToken === undefined) {
    throw new Error('Start the line before its line ending')
  }

  if (code === null) {
    return yield reconsume(INDENTED_CODE_AFTER_LINE_STATE)
  }

  if (lineToken.lineEnding === undefined) {
    lineToken.lineEnding = {
      type: 'lineEnding',
      value: String.fromCharCode(code),
      position: {start: tokenizer.now()}
    }

    yield consume()

    lineToken.lineEnding.position.end = tokenizer.now()
  } else {
    yield reconsume(INDENTED_CODE_AFTER_LINE_STATE)
  }
}

function* afterLineState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {line, column, offset, virtualColumn} = tokenizer
  const {lineToken} = contextInfo

  if (lineToken === undefined) {
    throw new Error('Start the line before ending it')
  }

  // Initial blank lines:
  if (lineToken.blank === true && contextInfo.open === false) {
    return yield reconsume(INDENTED_CODE_BOGUS_STATE)
  }

  lineToken.position.end = tokenizer.now()
  contextInfo.lineToken = undefined

  if (lineToken.blank === true) {
    contextInfo.blanks.push(lineToken)
  } else {
    if (contextInfo.open === false) {
      contextInfo.open = true
    }

    contextInfo.safePlace = {line, column, offset, virtualColumn}

    if (contextInfo.blanks.length !== 0) {
      contextInfo.lines = contextInfo.lines.concat(contextInfo.blanks)
      contextInfo.blanks = []
    }

    contextInfo.lines.push(lineToken)
  }

  // If this is the EOF, end the code, otherwise start a new line.
  yield reconsume(code === null ? INDENTED_CODE_END_STATE : INDENTED_CODE_BEFORE_LINE_STATE)
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!

  // Todo: use a temporary buffer if we start dropping characters.
  Object.assign(tokenizer, contextInfo.safePlace)

  yield next()
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const contextInfo = tokenizer.contextInfo

  // If for some reason we aren’t open:
  if (contextInfo.open === false) {
    return yield reconsume(INDENTED_CODE_BOGUS_STATE)
  }

  // tslint:disable-next-line:no-console
  console.log('indented code:', contextInfo)

  yield switchContext(tokenizer.returnContext!)

  if (contextInfo.blanks.length !== 0) {
    contextInfo.blanks = []
    // Todo: use a temporary buffer if we start dropping characters.
    Object.assign(tokenizer, contextInfo.safePlace)
  } else {
    yield next()
  }
}
