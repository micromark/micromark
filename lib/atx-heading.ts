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
function startState() {
  var self = this
  var info = self.contextInfo

  info.tokens = []
  info.rank = 0
  info.initial = self.offset
  info.openingSequenceBefore = null
  info.openingSequence = null
  info.openingSequenceAfter = null
  info.content = null
  info.closingSequenceBefore = null
  info.closingSequence = null
  info.closingSequenceAfter = null

  self.reconsume(OPENING_SEQUENCE_BEFORE_STATE)
}

function openingSequenceBeforeState(code) {
  var self = this
  var info = self.contextInfo
  var tail = info.token

  if (code === c.space) {
    if (tail && self.offset - tail.position.start.offset === maxOpeningSequenceBeforeSize) {
      self.reconsume(BOGUS_STATE)
    } else {
      if (!tail) {
        tail = { type: T_SPACE, position: { start: self.now() } }
        info.token = tail
        info.tokens.push(tail)
      }

      self.consume()
    }
  } else if (code === c.numberSign) {
    if (tail) {
      tail.position.end = self.now()
    }

    self.reconsume(OPENING_SEQUENCE_STATE)
  } else {
    self.reconsume(BOGUS_STATE)
  }
}

function openingSequenceState(code) {
  var self = this
  var info = self.contextInfo
  var sequence = info.openingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = self.now()
    }

    self.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = self.now()
    }

    self.reconsume(OPENING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (info.rank === maxOpeningSequenceSize) {
      self.reconsume(BOGUS_STATE)
    } else {
      if (sequence === null) {
        sequence = { start: self.now() }
        info.openingSequence = sequence
      }

      info.rank++
      self.consume()
    }
  } else {
    // Any other character is a bogus heading.
    // CommonMark requires a the opening sequence after space.
    self.reconsume(BOGUS_STATE)
  }
}

function openingSequenceAfterState(code) {
  var self = this
  var info = self.contextInfo
  var after = info.openingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = self.now()
    }

    self.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (after === null) {
      after = { start: self.now() }
      info.openingSequenceAfter = after
    }

    self.consume()
  } else if (code === c.numberSign) {
    if (after) {
      after.end = self.now()
    }

    // This could also be a hash in the content, CLOSING_SEQUENCE_STATE
    // switches back.
    self.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    if (after) {
      after.end = self.now()
    }

    self.reconsume(CONTENT_STATE)
  }
}

function contentState(code) {
  var self = this
  var info = self.contextInfo
  var content = info.content

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (content) {
      content.end = self.now()
    }

    self.reconsume(END_STATE)
  } else if (code === c.space) {
    if (content) {
      content.end = self.now()
    }

    self.reconsume(CLOSING_SEQUENCE_BEFORE_STATE)
  } else if (code === c.numberSign) {
    if (content) {
      content.end = self.now()
    }

    self.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    if (content === null) {
      content = { start: self.now() }
      info.content = content
    }

    self.consume()
  }
}

function closingSequenceBeforeState(code) {
  var self = this
  var info = self.contextInfo
  var before = info.closingSequenceBefore

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (before) {
      before.end = self.now()
    }

    self.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (info.closingSequenceBefore === null) {
      before = { start: self.now() }
      info.closingSequenceBefore = before
    }

    self.consume()
  } else if (code === c.numberSign) {
    if (before) {
      before.end = self.now()
    }

    self.reconsume(CLOSING_SEQUENCE_STATE)
  } else {
    info.closingSequenceBefore = null
    self.reconsume(CONTENT_STATE)
  }
}

function closingSequenceState(code) {
  var self = this
  var info = self.contextInfo
  var sequence = info.closingSequence

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (sequence) {
      sequence.end = self.now()
    }

    self.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (sequence) {
      sequence.end = self.now()
    }

    self.reconsume(CLOSING_SEQUENCE_AFTER_STATE)
  } else if (code === c.numberSign) {
    if (sequence === null) {
      sequence = { start: self.now() }
      info.closingSequence = sequence
    }

    self.consume()
  } else {
    info.closingSequenceBefore = null
    info.closingSequence = null
    self.reconsume(CONTENT_STATE)
  }
}

function closingSequenceAfterState(code) {
  var self = this
  var info = self.contextInfo
  var after = info.closingSequenceAfter

  if (code === c.eof || code === c.lineFeed || code === c.carriageReturn) {
    if (after) {
      after.end = self.now()
    }
    self.reconsume(END_STATE)
  } else if (code === c.tab || code === c.space) {
    if (after === null) {
      after = { start: self.now() }
      info.closingSequenceAfter = after
    }

    self.consume()
  } else {
    info.closingSequenceBefore = null
    info.closingSequence = null
    info.closingSequenceAfter = null
    self.reconsume(CONTENT_STATE)
  }
}

function bogusState() {
  var self = this
  var info = self.contextInfo

  self.switch(self.returnContext)
  self.state = self.bogusState
  self.offset = info.initial
  self.next()
}

function endState() {
  var self = this
  var s = self.contextInfo

  console.log('heading: ', s)
  self.consume()
  self.switch(self.returnContext)
}
