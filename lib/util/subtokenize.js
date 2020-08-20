module.exports = subtokenize

var assert = require('assert')
var codes = require('../character/codes')
var splice = require('../constant/splice')
var types = require('../constant/types')
var flatMap = require('./flat-map')
var shallow = require('./shallow')

function subtokenize(events) {
  var index = -1
  var more
  var event
  var tailIndex
  var lineIndex
  var tailEvent
  var subevents

  while (++index < events.length) {
    event = events[index]

    if (event === codes.eof) {
      break
    }

    if (event[0] === 'enter') {
      subevents = event[1]._subevents

      if (subevents) {
        assert.equal(
          event[1].type,
          events[index + 1][1].type,
          'expected a void token'
        )

        splice.apply(events, [index, 2].concat(subevents))
        index += subevents.length - 1
        event[1]._subevents = undefined
        more = true
      } else if (event[1].contentType && !event[1]._contentTokenized) {
        unravelLinkedTokens(event[1], event[2])

        // Iterate over this token again, so we’ll hit `_subevents` above.
        index--
      }
    }
    // If this is an exit of a container:
    else if (
      event[1].type === types.blockQuote ||
      event[1].type === types.listOrdered ||
      event[1].type === types.listUnordered
    ) {
      tailIndex = index
      lineIndex = undefined

      while (tailIndex--) {
        tailEvent = events[tailIndex]

        if (
          tailEvent[1].type === types.lineEnding ||
          tailEvent[1].type === types.lineEndingBlank
        ) {
          if (tailEvent[0] === 'exit') continue

          if (lineIndex) {
            events[lineIndex][1].type = types.lineEndingBlank
          }

          tailEvent[1].type = types.lineEnding
          lineIndex = tailIndex
        } else {
          break
        }
      }

      if (lineIndex) {
        // Fix position.
        event[1].end = shallow(events[lineIndex][1].start)

        // Switch container exit w/ line endings.
        splice.apply(
          events,
          [lineIndex, index - lineIndex + 1, event].concat(
            events.slice(lineIndex, index)
          )
        )
        index = lineIndex
      }
    }
  }

  return {done: !more, events: events}
}

function unravelLinkedTokens(token, context) {
  var tokenizer
  var stream

  if (!token._tokenizer) {
    stream = context.sliceStream(token)

    if (token.previous) {
      tokenizer = token.previous._tokenizer
      tokenizer.defineSkip(token.start)
    } else {
      tokenizer = context.parser[token.contentType](token.start)
    }

    token._tokenizer = tokenizer

    if (!token.next) {
      stream = stream.concat(codes.eof)
    }

    flatMap(stream, tokenizer.write)
  }

  token._contentTokenized = true

  if (token.next) {
    // Unravel the next token.
    unravelLinkedTokens(token.next, context)
  } else {
    // Done!
    divideTokens(token)
  }
}

function divideTokens(token) {
  var events = token._tokenizer.events
  var lineIndex
  var lineEnd
  var seenEnter

  assert.equal(events.pop(), codes.eof, 'expected eof token')

  lineIndex = events.length

  while (lineIndex--) {
    if (events[lineIndex][0] === 'enter') {
      seenEnter = true
    } else if (
      seenEnter &&
      (events[lineIndex][1].type === types.codeSpanPaddingLineEnding ||
        events[lineIndex][1].type === types.lineEnding ||
        events[lineIndex][1].type === types.lineEndingBlank ||
        events[lineIndex][1]._break)
    ) {
      token._subevents = events.slice(lineIndex + 1, lineEnd)
      token = token.previous
      lineEnd = lineIndex + 1
    }
  }

  assert(!token.previous, 'expected no previous token')

  // Do head:
  token._subevents = events.slice(0, lineEnd)
}
