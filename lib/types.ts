import {ContextType, ParseAction} from './actions'
export {ContextType} from './actions'

export interface Point {
  line: number
  column: number
  offset: number
}

export interface Position {
  start: Point
  end?: Point
}

export interface Place extends Point {
  virtualColumn: number
}

// TODO this is temporary until the circular dependency between Tokenizer and the context handlers is solved
export interface TokenizeType<ContextInfo> {
  contextInfo: ContextInfo
  context: ContextType
  stateHandlers?: ContextHandler<string>
  returnContext?: ContextType
  contextHandlers: ContextHandlers
  state: string // TODO use a more specific type
  bogusState?: string // TODO use a more specific type
  data: string
  line: number
  column: number
  offset: number
  virtualColumn: number
  tabSize: number
  now(): Point
}

export type ContextStateHandler<StateType extends string> = (
  tokenizer: TokenizeType<any>,
  code: number | null
) => IterableIterator<ParseAction<StateType>>

export type ContextHandler<StateType extends string> = {
  [_ in StateType]: ContextStateHandler<StateType>
}

export type ContextHandlers = {[Context in ContextType]: ContextHandler<string>}
