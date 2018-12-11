const fromCode = String.fromCharCode
import { reconsume, switchContext } from './actions'
import { ContextHandler, ContextType, TokenizeType } from './types'

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

function* startState(_tokenizer: TokenizeType<void>) {
  yield reconsume(StateType.ATX_HEADING_STATE)
}

function* bogusState(_tokenizer: TokenizeType<void>, code: number | null): IterableIterator<never> {
  throw new Error(`Could not parse code ${fromCode(code || 0)}`)
}

function attempt(context: ContextType, bogus: StateType) {
  return function*(tokenizer: TokenizeType<void>, code: number | null) {
    // When done, go back to this context.
    tokenizer.returnContext = tokenizer.context
    yield switchContext(context)
    // When bogus, go to the `bogus` state.
    tokenizer.bogusState = bogus
    // tslint:disable-next-line:no-console
    console.log('attempt: %s', context, [fromCode(code || 0)])
  }
}
