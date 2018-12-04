import * as c from './characters'

var maxOpeningSequenceBeforeSize = 3
var maxOpeningSequenceSize = 6

var T_SPACE = 'space'

var START_STATE = 'START_STATE'
var END_STATE = 'END_STATE'
var BOGUS_STATE = 'BOGUS_STATE'
var OPENING_SEQUENCE_BEFORE_STATE = 'OPENING_SEQUENCE_BEFORE_STATE'
var OPENING_SEQUENCE_STATE = 'OPENING_SEQUENCE_STATE'
var OPENING_SEQUENCE_AFTER_STATE = 'OPENING_SEQUENCE_AFTER_STATE'
var CONTENT_STATE = 'CONTENT_STATE'
var CLOSING_SEQUENCE_BEFORE_STATE = 'CLOSING_SEQUENCE_BEFORE_STATE'
var CLOSING_SEQUENCE_STATE = 'CLOSING_SEQUENCE_STATE'
var CLOSING_SEQUENCE_AFTER_STATE = 'CLOSING_SEQUENCE_AFTER_STATE'

export default {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [BOGUS_STATE]: bogusState,
  [OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [OPENING_SEQUENCE_STATE]: openingSequenceState,
  [OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [CONTENT_STATE]: contentState,
  [CLOSING_SEQUENCE_BEFORE_STATE]: closingSequenceBeforeState,
  [CLOSING_SEQUENCE_STATE]: closingSequenceState,
  [CLOSING_SEQUENCE_AFTER_STATE]: closingSequenceAfterState
}

// ATX heading. Such as:
//
// ```markdown
// ␠# Hello
// #
// # Hello
// ## Hello
// #␠␠Hello
// # Hello # World
// # Hello␠␠
// # Hello #
// # Hello # World #
// # Hello #␠␠
// # Hello␠␠#␠␠
// # Hello #########
// ```
//
// ␠␠␠###␠␠␠foo␠␠␠###␠␠␠
// ^^^^^^^^^^^^^^^^^^^^^ heading
//
// ␠␠␠###␠␠␠foo␠␠␠###␠␠␠
// ^^^^^^^^^ opening
//          ^^^ value
//     closing ^^^^^^^^^
//
// ␠␠␠###␠␠␠
// ^^^ before
//    ^^^ value
// after ^^^
function startState(tokenizer: any) {
  var info = tokenizer.contextInfo

  info.tokens = []
  info.rank = 0
  info.initial = tokenizer.offset
  info.openingSequenceBefore = null
  info.openingSequence = null
  info.openingSequenceAfter = null
  info.content = null
  info.closingSequenceBefore = null
  info.closingSequence = null
  info.closingSequenceAfter = null

  tokenizer.reconsume(OPENING_SEQUENCE_BEFORE_STATE)
}

function openingSequenceBeforeState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var tail = info.token

  if (code === c.space) {
    if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
      tokenizer.reconsume(BOGUS_STATE)
    } else {
      if (!tail) {
        tail = { type: T_SPACE, position: { start: tokenizer.now() } }
        info.token = tail
        info.tokens.push(tail)
      }

      tokenizer.consume()
    }
  } else if (code === c.numberSign) {
    if (tail) {
      tail.position.end = tokenizer.now()
    }

    tokenizer.reconsume(OPENING_SEQUENCE_STATE)
  } else {
    tokenizer.reconsume(BOGUS_STATE)
  }
}

function openingSequenceState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var sequence = info.openingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(OPENING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (info.rank === maxOpeningSequenceSize) {
      tokenizer.reconsume(BOGUS_STATE)
    } else {
      if (sequence === null) {
        sequence = { start: tokenizer.now() }
        info.openingSequence = sequence
      }

      info.rank++
      tokenizer.consume()
    }
  } else {
    // Any other character is a bogus heading.
    // CommonMark requires a the opening sequence after space.
    tokenizer.reconsume(BOGUS_STATE)
  }
}

function openingSequenceAfterState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var after = info.openingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = tokenizer.now()
    }

    tokenizer.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (after === null) {
      after = { start: tokenizer.now() }
      info.openingSequenceAfter = after
    }

    tokenizer.consume()
  } else if (code === c.numberSign) {
    if (after) {
      after.end = tokenizer.now()
    }

    // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
    // switches back.
    tokenizer.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    if (after) {
      after.end = tokenizer.now()
    }

    tokenizer.reconsume(CONTENT_STATE)
  }
}

function contentState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var content = info.content

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(END_STATE)
  } else if (code === c.space) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(CLOSING_SEQUENCE_BEFORE_STATE)
  } else if (code === c.numberSign) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    if (content === null) {
      content = { start: tokenizer.now() }
      info.content = content
    }

    tokenizer.consume()
  }
}

function closingSequenceBeforeState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var before = info.closingSequenceBefore

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (before) {
      before.end = tokenizer.now()
    }

    tokenizer.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (info.closingSequenceBefore === null) {
      before = { start: tokenizer.now() }
      info.closingSequenceBefore = before
    }

    tokenizer.consume()
  } else if (code === c.numberSign) {
    if (before) {
      before.end = tokenizer.now()
    }

    tokenizer.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    info.closingSequenceBefore = null
    tokenizer.reconsume(CONTENT_STATE)
  }
}

function closingSequenceState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var sequence = info.closingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(CLOSING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (sequence === null) {
      sequence = { start: tokenizer.now() }
      info.closingSequence = sequence
    }

    tokenizer.consume()
  } else {
    info.closingSequenceBefore = null
    info.closingSequence = null
    tokenizer.reconsume(CONTENT_STATE)
  }
}

function closingSequenceAfterState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var after = info.closingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = tokenizer.now()
    }
    tokenizer.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (after === null) {
      after = { start: tokenizer.now() }
      info.closingSequenceAfter = after
    }

    tokenizer.consume()
  } else {
    info.closingSequenceBefore = null
    info.closingSequence = null
    info.closingSequenceAfter = null
    tokenizer.reconsume(CONTENT_STATE)
  }
}

function bogusState(tokenizer: any) {
  var info = tokenizer.contextInfo

  tokenizer.switch(tokenizer.returnContext)
  tokenizer.state = tokenizer.bogusState
  tokenizer.offset = info.initial
  tokenizer.next()
}

function endState(tokenizer: any) {
  var s = tokenizer.contextInfo

  console.log('heading: ', s)
  tokenizer.consume()
  tokenizer.switch(tokenizer.returnContext)
}
