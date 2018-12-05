/* eslint-disable no-caller */

import * as c from './characters'

var fromCode = String.fromCharCode

export enum StateType {
  START_STATE = 'START_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  END_STATE = 'END_STATE'
}

export default {
  [StateType.START_STATE]: startState,
  [StateType.CONTENT_STATE]: contentState,
  [StateType.END_STATE]: endState
}

// Paragraph.
function startState(tokenizer: any) {
  var info = tokenizer.contextInfo

  info.initialIndex = tokenizer.offset
  info.contentStart = tokenizer.offset
  info.contentEnd = null

  tokenizer.reconsume(StateType.CONTENT_STATE)
}

function contentState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo

  if (code === c.eof || code === c.nil || code === c.lineFeed) {
    tokenizer.reconsume(StateType.END_STATE)
  } else {
    info.contentEnd = ++tokenizer.offset
    console.log('p:consume: %s', arguments.callee.name, code, [fromCode(code)])
  }
}

function endState(tokenizer: any) {
  var s = tokenizer.contextInfo
  var data = tokenizer.data
  var tokens = [{ type: 'paragraph', value: data.slice(s.contentStart, s.contentEnd) }]

  console.log('p: done! ', tokens)
  tokenizer.offset++
}
