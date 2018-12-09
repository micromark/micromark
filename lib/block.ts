const fromCode = String.fromCharCode
import { ContextType, TokenizeType, ContextHandler } from './types'

export enum StateType {
  START_STATE = 'START_STATE',
  BOGUS_STATE = 'BOGUS_STATE',
  ATX_HEADING_STATE = 'ATX_HEADING_STATE',
  PARAGRAPH_STATE = 'PARAGRAPH_STATE'
}

export const contextHandler: ContextHandler<StateType> = {
  [StateType.START_STATE]: startState,
  [StateType.BOGUS_STATE]: bogusState,
  [StateType.ATX_HEADING_STATE]: attempt('atxHeading', StateType.PARAGRAPH_STATE),
  [StateType.PARAGRAPH_STATE]: attempt('paragraph', StateType.BOGUS_STATE)
}

function startState(tokenizer: TokenizeType) {
  return tokenizer.reconsume(StateType.ATX_HEADING_STATE)
}

function bogusState(_tokenizer: TokenizeType, code: number | null) {
  throw new Error(`Could not parse code ${fromCode(code || 0)}`)
}

function attempt(context: ContextType, bogus: StateType) {
  return (tokenizer: TokenizeType, code: number | null) => {
    // When done, go back to this context.
    tokenizer.returnContext = tokenizer.context
    tokenizer.switch(context)
    // When bogus, go to the `bogus` state.
    tokenizer.bogusState = bogus
    // tslint:disable-next-line:no-console
    console.log('attempt: %s', context, [fromCode(code || 0)])
  }
}
