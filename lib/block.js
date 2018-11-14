var fromCode = String.fromCharCode

var START_STATE = 'START_STATE'
var BOGUS_STATE = 'BOGUS_STATE'
var ATX_HEADING_STATE = 'ATX_HEADING_STATE'
var PARAGRAPH_STATE = 'PARAGRAPH_STATE'

exports[START_STATE] = startState
exports[BOGUS_STATE] = bogusState
exports[ATX_HEADING_STATE] = attempt('atxHeading', PARAGRAPH_STATE)
exports[PARAGRAPH_STATE] = attempt('paragraph')

function startState() {
  this.reconsume(ATX_HEADING_STATE)
}

function bogusState(code) {
  throw new Error('Could not parse code %s', fromCode(code))
}

function attempt(context, bogus) {
  return state
  function state(code) {
    var self = this
    // When done, go back to this context.
    self.returnContext = self.context
    self.switch(context)
    // When bogus, go to the `bogus` state.
    self.bogusState = bogus || BOGUS_STATE
    console.log('attempt: %s', context, [fromCode(code)])
  }
}
