import { __generator as tslib__generator } from 'tslib'
import { consume, reconsume, switchContext } from './actions'
import { eof, lineFeed, nil } from './characters'
import { ContextHandler, TokenizeType } from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const fromCode = String.fromCharCode

export interface ContextInfo {
  initialIndex: number
  contentStart: number
  contentEnd: number | undefined
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
  const { offset } = tokenizer
  tokenizer.contextInfo = {
    initialIndex: offset,
    contentStart: offset,
    contentEnd: undefined
  }
  yield reconsume(CONTENT_STATE)
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo

  switch (code) {
    case eof:
    case nil:
    case lineFeed:
      yield reconsume(END_STATE)
      break
    default:
      info.contentEnd = ++tokenizer.offset
      // tslint:disable-next-line:no-console
      console.log('p:consume: %s', contentState.name, code, [fromCode(code!)])
      break
  }
}

function* endState(tokenizer: TokenizeType<ContextInfo>): IterableIterator<any> {
  const info = tokenizer.contextInfo

  // tslint:disable-next-line:no-console
  console.log('heading: ', info)

  yield consume()

  yield switchContext(tokenizer.returnContext!)
}
