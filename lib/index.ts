import * as c from './characters'
import atxHeading from './atx-heading'
import paragraph from './paragraph'
import block from './block'

type ContextType = 'atxHeading' | 'paragraph' | 'block'

export class Tokenizer {
  data = ''
  line = 1
  column = 1
  virtualColumn = 1
  offset = 0
  tabSize = 2

  context: ContextType = 'block'
  stateHandlers: any
  contextInfo = {}
  state: string = ''

  constructor() {
    this.switch('block')
  }

  write(chunk: string) {
    this.data += chunk

    while (this.offset <= this.data.length) {
      this.next()
    }
  }

  current() {
    var length = this.data.length
    var offset = this.offset

    if (offset > length) {
      throw new Error('Cannot read after end')
    }

    // Use `null` instead of NaN for EOF code.
    if (length === offset) {
      return null
    }

    // Use `�` instead of `\0` (https://spec.commonmark.org/0.28/#insecure-characters).
    return this.data.charCodeAt(offset) || c.replacementCharacter
  }

  now() {
    const { line, column, offset } = this
    return { line, column, offset }
  }

  consume() {
    var code = this.current()
    var tabSize = this.tabSize

    if (code === null || code === c.eof || code === c.lineFeed) {
      this.line++
      this.column = 0
    } else if (code === c.tab) {
      this.virtualColumn = Math.floor(this.virtualColumn / tabSize) * tabSize + tabSize
    }

    // TODO handling code === null
    console.log('consume: %s', this.state, this.now(), [String.fromCharCode(code!)])

    this.column++
    this.offset++
  }

  reconsume(state: string) {
    this.state = state
    this.next()
  }

  next() {
    const fn = this.stateHandlers[this.state]

    if (!fn) {
      throw new Error('Cannot handle `' + this.context + '.' + this.state + '`')
    }

    fn(this, this.current())
  }

  switch(name: ContextType) {
    this.context = name
    this.stateHandlers = this[name]
    this.contextInfo = {}
    this.state = 'START_STATE'
  }

  block = block
  atxHeading = atxHeading
  paragraph = paragraph
}
