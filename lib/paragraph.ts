import {__generator as tslib__generator} from 'tslib'
import {consume, reconsume, switchContext} from './actions'
import {carriageReturn, eof, lineFeed} from './characters'
import {ContextHandler, Point, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

export interface ContextInfo {
  content: {start: Point; end: Point}
}

export type StateType = 'START_STATE' | 'CONTENT_STATE' | 'END_STATE'

const START_STATE = 'START_STATE'
const CONTENT_STATE = 'CONTENT_STATE'
const END_STATE = 'END_STATE'

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [CONTENT_STATE]: contentState,
  [END_STATE]: endState
}

// Paragraph.
function* startState(tokenizer: TokenizeType<ContextInfo>) {
  tokenizer.contextInfo = {
    content: {start: tokenizer.now(), end: tokenizer.now()}
  }

  yield reconsume(CONTENT_STATE)
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      contextInfo.content.end = tokenizer.now()
      yield reconsume(END_STATE)
      break
    default:
      yield consume()
      break
  }
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo, data} = tokenizer
  const {content} = contextInfo

  // tslint:disable-next-line:no-console
  console.log('paragraph:', {
    type: 'paragraph',
    value: data.slice(content.start.offset, content.end.offset),
    position: content
  })

  yield consume()
  yield switchContext(tokenizer.returnContext!)
}
