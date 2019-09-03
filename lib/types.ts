import {ContextType, ParseAction} from './actions'
export {ContextType} from './actions'

export interface Position {
  line: number
  column: number
  offset: number
}

// TODO this is temporary until the circular dependency between Tokenizer and the context handlers is solved
export interface TokenizeType<ContextInfo> {
  contextInfo: ContextInfo
  context: ContextType
  returnContext?: ContextType
  state: string // TODO use a more specific type
  bogusState?: string // TODO use a more specific type
  data: string
  offset: number
  now(): Position
}

export type ContextStateHandler<StateType extends string> = (
  tokenizer: TokenizeType<any>,
  code: number | null
) => IterableIterator<ParseAction<StateType>>

export type ContextHandler<StateType extends string> = {
  [_ in StateType]: ContextStateHandler<StateType>
}

export type ContextHandlers = {[Context in ContextType]: ContextHandler<string>}
