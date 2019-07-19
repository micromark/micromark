import { CONSUME, NEXT, RECONSUME, SWITCH_CONTEXT } from './actions'
import { contextHandler as atxHeading } from './atx-heading'
import { contextHandler as block } from './block'
import { eof, lineFeed, replacementCharacter, tab } from './characters'
import { contextHandler as codeFenced } from './code-fenced'
import { contextHandler as paragraph } from './paragraph'
import { ContextHandler, ContextHandlers, ContextType, TokenizeType } from './types'

export class Tokenizer implements TokenizeType<any> {
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
    paragraph,
    codeFenced
  }

  constructor() {
    this.switch('block')
  }

  public write(chunk: string) {
    this.data += chunk

    while (this.offset < this.data.length) {
      this.exec()
    }
  }

  public end() {
    this.exec()
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
    return this.data.charCodeAt(offset) || replacementCharacter
  }

  public now() {
    const { line, column, offset } = this
    return { line, column, offset }
  }

  public exec() {
    const stack = [this.next()]
    while (stack.length > 0) {
      const { done: isTaskFinished, value: task } = stack[stack.length - 1].next()
      if (isTaskFinished) {
        stack.pop()
        continue
      }
      switch (task.type) {
        case CONSUME:
          this.consume()
          break
        case NEXT:
          stack.push(this.next())
          break
        case RECONSUME:
          stack.push(this.reconsume(task.state))
          break
        case SWITCH_CONTEXT:
          this.switch(task.context)
          break
      }
    }
  }

  private switch(name: ContextType) {
    this.context = name
    this.stateHandlers = this.contextHandlers[name]
    this.contextInfo = {}
    this.state = 'START_STATE'
  }

  private consume() {
    const code = this.current()
    const tabSize = this.tabSize

    if (code === null || code === eof || code === lineFeed) {
      this.line++
      this.column = 0
    } else if (code === tab) {
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
      throw new Error(`Cannot handle \`${this.context}.${this.state}\``)
    }

    return fn(this, this.current())
  }
}
