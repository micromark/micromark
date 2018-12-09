import { ParseAction } from './actions'

export type ContextType = 'atxHeading' | 'paragraph' | 'block'
export interface Position {
  line: number
  column: number
  offset: number
}

// TODO this is temporary until the circular dependency between Tokenizer and the context handlers is solved
export interface TokenizeType {
  contextInfo: any // TODO use a more specific type
  context: ContextType
  returnContext?: ContextType
  state: string // TODO use a more specific type
  bogusState?: string // TODO use a more specific type
  data: string
  offset: number
  switch(name: ContextType): void
  now(): Position
}

export type ContextStateHandler<StateType extends string> = ((
  tokenizer: TokenizeType,
  code: number | null
) => ParseAction<StateType>)

export type ContextHandler<StateType extends string> = {
  [_ in StateType]: ContextStateHandler<StateType>
}

export type ContextHandlers = { [Context in ContextType]: ContextHandler<string> }
