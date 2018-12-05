import atxHeading from './atx-heading'
import block from './block'
import * as c from './characters'
import paragraph from './paragraph'

type ContextType = 'atxHeading' | 'paragraph' | 'block'

export class Tokenizer {
  public data = ''
  public line = 1
  public column = 1
  public virtualColumn = 1
  public offset = 0
  public tabSize = 2

  public context: ContextType = 'block'
  public stateHandlers: any
  public contextInfo = {}
  public state: string = ''

  public block: any = block
  public atxHeading: any = atxHeading
  public paragraph: any = paragraph

  constructor() {
    this.switch('block')
  }

  public write(chunk: string) {
    this.data += chunk

    while (this.offset <= this.data.length) {
      this.next()
    }
  }

  public current() {
    const length = this.data.length
    const offset = this.offset

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

  public now() {
    const { line, column, offset } = this
    return { line, column, offset }
  }

  public consume() {
    const code = this.current()
    const tabSize = this.tabSize

    if (code === null || code === c.eof || code === c.lineFeed) {
      this.line++
      this.column = 0
    } else if (code === c.tab) {
      this.virtualColumn = Math.floor(this.virtualColumn / tabSize) * tabSize + tabSize
    }

    // TODO handling code === null
    // tslint:disable-next-line:no-console
    console.log('consume: %s', this.state, this.now(), [String.fromCharCode(code!)])

    this.column++
    this.offset++
  }

  public reconsume(state: string) {
    this.state = state
    this.next()
  }

  public next() {
    const fn = this.stateHandlers[this.state]

    if (!fn) {
      throw new Error('Cannot handle `' + this.context + '.' + this.state + '`')
    }

    fn(this, this.current())
  }

  public switch(name: ContextType) {
    this.context = name
    this.stateHandlers = this[name]
    this.contextInfo = {}
    this.state = 'START_STATE'
  }
}
