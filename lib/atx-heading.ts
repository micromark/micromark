import * as c from './characters'

var maxOpeningSequenceBeforeSize = 3
var maxOpeningSequenceSize = 6

var T_SPACE = 'space'

export enum StateType {
  START_STATE = 'START_STATE',
  END_STATE = 'END_STATE',
  BOGUS_STATE = 'BOGUS_STATE',
  OPENING_SEQUENCE_BEFORE_STATE = 'OPENING_SEQUENCE_BEFORE_STATE',
  OPENING_SEQUENCE_STATE = 'OPENING_SEQUENCE_STATE',
  OPENING_SEQUENCE_AFTER_STATE = 'OPENING_SEQUENCE_AFTER_STATE',
  CONTENT_STATE = 'CONTENT_STATE',
  CLOSING_SEQUENCE_BEFORE_STATE = 'CLOSING_SEQUENCE_BEFORE_STATE',
  CLOSING_SEQUENCE_STATE = 'CLOSING_SEQUENCE_STATE',
  CLOSING_SEQUENCE_AFTER_STATE = 'CLOSING_SEQUENCE_AFTER_STATE'
}

export default {
  [StateType.START_STATE]: startState,
  [StateType.END_STATE]: endState,
  [StateType.BOGUS_STATE]: bogusState,
  [StateType.OPENING_SEQUENCE_BEFORE_STATE]: openingSequenceBeforeState,
  [StateType.OPENING_SEQUENCE_STATE]: openingSequenceState,
  [StateType.OPENING_SEQUENCE_AFTER_STATE]: openingSequenceAfterState,
  [StateType.CONTENT_STATE]: contentState,
  [StateType.CLOSING_SEQUENCE_BEFORE_STATE]: closingSequenceBeforeState,
  [StateType.CLOSING_SEQUENCE_STATE]: closingSequenceState,
  [StateType.CLOSING_SEQUENCE_AFTER_STATE]: closingSequenceAfterState
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

  tokenizer.reconsume(StateType.OPENING_SEQUENCE_BEFORE_STATE)
}

function openingSequenceBeforeState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var tail = info.token

  if (code === c.space) {
    if (tail && tokenizer.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
      tokenizer.reconsume(StateType.BOGUS_STATE)
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

    tokenizer.reconsume(StateType.OPENING_SEQUENCE_STATE)
  } else {
    tokenizer.reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var sequence = info.openingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.OPENING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (info.rank === maxOpeningSequenceSize) {
      tokenizer.reconsume(StateType.BOGUS_STATE)
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
    tokenizer.reconsume(StateType.BOGUS_STATE)
  }
}

function openingSequenceAfterState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var after = info.openingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.END_STATE)
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
    tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
  } else {
    if (after) {
      after.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function contentState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var content = info.content

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.END_STATE)
  } else if (code === c.space) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.CLOSING_SEQUENCE_BEFORE_STATE)
  } else if (code === c.numberSign) {
    if (content) {
      content.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
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

    tokenizer.reconsume(StateType.END_STATE)
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

    tokenizer.reconsume(StateType.CLOSING_SEQUENCE_STATE)
  } else {
    info.closingSequenceBefore = null
    tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function closingSequenceState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var sequence = info.closingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = tokenizer.now()
    }

    tokenizer.reconsume(StateType.CLOSING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (sequence === null) {
      sequence = { start: tokenizer.now() }
      info.closingSequence = sequence
    }

    tokenizer.consume()
  } else {
    info.closingSequenceBefore = null
    info.closingSequence = null
    tokenizer.reconsume(StateType.CONTENT_STATE)
  }
}

function closingSequenceAfterState(tokenizer: any, code: number) {
  var info = tokenizer.contextInfo
  var after = info.closingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = tokenizer.now()
    }
    tokenizer.reconsume(StateType.END_STATE)
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
    tokenizer.reconsume(StateType.CONTENT_STATE)
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
