/* eslint-disable no-caller */

import * as c from './characters'

const fromCode = String.fromCharCode

export enum StateType {
  START_STATE = 'START_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  END_STATE = 'END_STATE',
}

export default {
  [StateType.START_STATE]: startState,
  [StateType.CONTENT_STATE]: contentState,
  [StateType.END_STATE]: endState,
}

// Paragraph.
function startState(tokenizer: any) {
  const info = tokenizer.contextInfo

  info.initialIndex = tokenizer.offset
  info.contentStart = tokenizer.offset
  info.contentEnd = null

  tokenizer.reconsume(StateType.CONTENT_STATE)
}

function contentState(tokenizer: any, code: number) {
  const info = tokenizer.contextInfo

  if (code === c.eof || code === c.nil || code === c.lineFeed) {
    tokenizer.reconsume(StateType.END_STATE)
  } else {
    info.contentEnd = ++tokenizer.offset
    // tslint:disable-next-line:no-console
    console.log('p:consume: %s', contentState.name, code, [fromCode(code)])
  }
}

function endState(tokenizer: any) {
  const s = tokenizer.contextInfo
  const data = tokenizer.data
  const tokens = [{ type: 'paragraph', value: data.slice(s.contentStart, s.contentEnd) }]

  // tslint:disable-next-line:no-console
  console.log('p: done! ', tokens)
  tokenizer.offset++
}
