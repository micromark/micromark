const fromCode = String.fromCharCode

export enum StateType {
  START_STATE = 'START_STATE',
  BOGUS_STATE = 'BOGUS_STATE',
  ATX_HEADING_STATE = 'ATX_HEADING_STATE',
  PARAGRAPH_STATE = 'PARAGRAPH_STATE',
}

export default {
  [StateType.START_STATE]: startState,
  [StateType.BOGUS_STATE]: bogusState,
  [StateType.ATX_HEADING_STATE]: attempt('atxHeading', StateType.PARAGRAPH_STATE),
  [StateType.PARAGRAPH_STATE]: attempt('paragraph', StateType.BOGUS_STATE),
}

function startState(tokenizer: any) {
  tokenizer.reconsume(StateType.ATX_HEADING_STATE)
}

function bogusState(_tokenizer: any, code: number) {
  throw new Error(`Could not parse code ${fromCode(code)}`)
}

function attempt(context: any, bogus: any) {
  return (tokenizer: any, code: number) => {
    // When done, go back to this context.
    tokenizer.returnContext = tokenizer.context
    tokenizer.switch(context)
    // When bogus, go to the `bogus` state.
    tokenizer.bogusState = bogus
    // tslint:disable-next-line:no-console
    console.log('attempt: %s', context, [fromCode(code)])
  }
}
