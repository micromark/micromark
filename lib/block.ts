import { __generator as tslib__generator } from 'tslib'
import { reconsume, switchContext } from './actions'
import { ContextHandler, ContextType, TokenizeType } from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const fromCode = String.fromCharCode

export type StateType = 'START_STATE' | 'BOGUS_STATE' | 'ATX_HEADING_STATE' | 'PARAGRAPH_STATE'

const START_STATE = 'START_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const ATX_HEADING_STATE = 'ATX_HEADING_STATE'
const PARAGRAPH_STATE = 'PARAGRAPH_STATE'

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [BOGUS_STATE]: bogusState,
  [ATX_HEADING_STATE]: attempt('atxHeading', PARAGRAPH_STATE),
  [PARAGRAPH_STATE]: attempt('paragraph', BOGUS_STATE)
}

function* startState(_tokenizer: TokenizeType<void>) {
  yield reconsume(ATX_HEADING_STATE)
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
