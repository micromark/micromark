import * as c from './characters'
import atxHeading from './atx-heading'
import paragraph from './paragraph'
import block from './block'

export class Tokenizer {
  data = ''
  line = 1
  column = 1
  virtualColumn = 1
  offset = 0
  tabSize = 2

  context: string = ''
  stateHandlers: any
  contextInfo = {}
  state: string = ''

  constructor() {
    this.switch('block')
  }

  write(chunk) {
    var self = this

    self.data += chunk

    while (self.offset <= self.data.length) {
      self.next()
    }
  }

  current() {
    var self = this
    var length = self.data.length
    var offset = self.offset

    if (offset > length) {
      throw new Error('Cannot read after end')
    }

    // Use `null` instead of NaN for EOF code.
    if (length === offset) {
      return null
    }

    // Use `�` instead of `\0` (https://spec.commonmark.org/0.28/#insecure-characters).
    return self.data.charCodeAt(offset) || c.replacementCharacter
  }

  now() {
    var self = this

    return { line: self.line, column: self.column, offset: self.offset }
  }

  consume() {
    var self = this
    var code = self.current()
    var tabSize = self.tabSize

    if (code === c.eof || code === c.lineFeed) {
      self.line++
      self.column = 0
    } else if (code === c.tab) {
      self.virtualColumn = Math.floor(self.virtualColumn / tabSize) * tabSize + tabSize
    }

    console.log('consume: %s', self.state, self.now(), [String.fromCharCode(code)])

    self.column++
    self.offset++
  }

  reconsume(state) {
    this.state = state
    this.next()
  }

  next() {
    var self = this
    var fn

    fn = self.stateHandlers[self.state]

    if (!fn) {
      throw new Error('Cannot handle `' + self.context + '.' + self.state + '`')
    }

    fn.call(self, self.current())
  }

  switch(name) {
    this.context = name
    this.stateHandlers = this[name]
    this.contextInfo = {}
    this.state = 'START_STATE'
  }

  block = block
  atxHeading = atxHeading
  paragraph = paragraph
}
