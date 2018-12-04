/* eslint-disable no-caller */

var c = require('./characters')

var fromCode = String.fromCharCode

var START_STATE = 'START_STATE'
var CONTENT_STATE = 'CONTENT_STATE'
var END_STATE = 'END_STATE'

exports[START_STATE] = startState
exports[CONTENT_STATE] = contentState
exports[END_STATE] = endState

// Paragraph.
function startState() {
  var self = this
  var info = self.contextInfo

  info.initialIndex = self.offset
  info.contentStart = self.offset
  info.contentEnd = null

  self.reconsume(CONTENT_STATE)
}

function contentState(code) {
  var self = this
  var info = self.contextInfo

  if (code === c.eof || code === c.nil || code === c.lineFeed) {
    self.reconsume(END_STATE)
  } else {
    info.contentEnd = ++self.offset
    console.log('p:consume: %s', arguments.callee.name, code, [fromCode(code)])
  }
}

function endState() {
  var self = this
  var s = self.contextInfo
  var data = self.data
  var tokens = [
    {type: 'paragraph', value: data.slice(s.contentStart, s.contentEnd)}
  ]

  console.log('p: done! ', tokens)
  self.offset++
}
