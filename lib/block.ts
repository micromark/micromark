var fromCode = String.fromCharCode

var START_STATE = 'START_STATE'
var BOGUS_STATE = 'BOGUS_STATE'
var ATX_HEADING_STATE = 'ATX_HEADING_STATE'
var PARAGRAPH_STATE = 'PARAGRAPH_STATE'

export default {
  [START_STATE]: startState,
  [BOGUS_STATE]: bogusState,
  [ATX_HEADING_STATE]: attempt('atxHeading', PARAGRAPH_STATE),
  [PARAGRAPH_STATE]: attempt('paragraph', BOGUS_STATE)
}

function startState(tokenizer: any) {
  tokenizer.reconsume(ATX_HEADING_STATE)
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
    console.log('attempt: %s', context, [fromCode(code)])
  }
}
