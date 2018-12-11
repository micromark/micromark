/* eslint-disable no-caller */
import { reconsume } from './actions'
import { eof, nil, lineFeed } from './characters'
import { ContextHandler, TokenizeType } from './types'

const fromCode = String.fromCharCode

export interface ContextInfo {
  initialIndex: number
  contentStart: number
  contentEnd: number | undefined
}

export type StateType = 'START_STATE' | 'CONTENT_STATE' | 'END_STATE'

const START_STATE = 'START_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  END_STATE = 'END_STATE'

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
  const { contextInfo: info, data } = tokenizer
  const tokens = [{ type: 'paragraph', value: data.slice(info.contentStart, info.contentEnd) }]

  // tslint:disable-next-line:no-console
  console.log('p: done! ', tokens)
  tokenizer.offset++
}
