/* eslint-disable no-caller */

import { reconsume } from './actions'
import * as c from './characters'
import { ContextHandler, TokenizeType } from './types'

const fromCode = String.fromCharCode

export interface ContextInfo {
  initialIndex: number
  contentStart: number
  contentEnd: number | undefined
}

export enum StateType {
  START_STATE = 'START_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  END_STATE = 'END_STATE'
}

export const contextHandler: ContextHandler<StateType> = {
  [StateType.START_STATE]: startState,
  [StateType.CONTENT_STATE]: contentState,
  [StateType.END_STATE]: endState
}

// Paragraph.
function* startState(tokenizer: TokenizeType<ContextInfo>) {
  const info = tokenizer.contextInfo

  info.initialIndex = tokenizer.offset
  info.contentStart = tokenizer.offset
  info.contentEnd = undefined

  yield reconsume(StateType.CONTENT_STATE)
}

function* contentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const info = tokenizer.contextInfo

  switch (code) {
    case c.eof:
    case c.nil:
    case c.lineFeed:
      yield reconsume(StateType.END_STATE)
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
  const data = tokenizer.data
  const tokens = [{ type: 'paragraph', value: data.slice(info.contentStart, info.contentEnd) }]

  // tslint:disable-next-line:no-console
  console.log('p: done! ', tokens)
  tokenizer.offset++
}
