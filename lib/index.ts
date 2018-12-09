import * as c from './characters'
import { contextHandler as atxHeading } from './atx-heading'
import { contextHandler as block } from './block'
import { contextHandler as paragraph } from './paragraph'
import { ContextType, TokenizeType, ContextHandlers, ContextHandler } from './types'
import { ParseActionType, noop } from './actions'

export class Tokenizer implements TokenizeType {
  public data = ''
  public line = 1
  public column = 1
  public virtualColumn = 1
  public offset = 0
  public tabSize = 2

  public context: ContextType = 'block'
  public returnContext?: ContextType
  public stateHandlers?: ContextHandler<string>
  public contextInfo = {}
  public bogusState?: string
  public state: string = ''

  public contextHandlers: ContextHandlers = {
    block,
    atxHeading,
    paragraph
  }

  constructor() {
    this.switch('block')
  }

  public write(chunk: string) {
    this.data += chunk

    while (this.offset <= this.data.length) {
      this.exec()
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

  private consume() {
    const code = this.current()
    const tabSize = this.tabSize

    if (code === null || code === c.eof || code === c.lineFeed) {
      this.line++
      this.column = 0
    } else if (code === c.tab) {
      this.virtualColumn = Math.floor(this.virtualColumn / tabSize) * tabSize + tabSize
    }

    // tslint:disable-next-line:no-console
    console.log('consume: %s', this.state, this.now(), [String.fromCharCode(code || 0)])

    this.column++
    this.offset++
  }

  private reconsume(state: string) {
    this.state = state
    return this.next()
  }

  private next() {
    const fn = this.stateHandlers![this.state]

    if (!fn) {
      throw new Error('Cannot handle `' + this.context + '.' + this.state + '`')
    }

    return fn(this, this.current())
  }

  public exec() {
    let task = this.next()
    while (task.type !== ParseActionType.NOOP) {
      switch (task.type) {
        case ParseActionType.CONSUME:
          this.consume()
          task = noop()
          break
        case ParseActionType.RECONSUME:
          task = this.reconsume(task.state)
          break
        case ParseActionType.NEXT:
          task = this.next()
          break
      }
    }
  }

  public switch(name: ContextType) {
    this.context = name
    this.stateHandlers = this.contextHandlers[name]
    this.contextInfo = {}
    this.state = 'START_STATE'
  }
}
