import * as assert from 'assert'
import * as codes from '../character/codes'
import splice from '../constant/splice'
import * as types from '../constant/types'
import flatMap from './flat-map'
import shallow from './shallow'
import type { Event } from '../types'

export default function subtokenize(events: Event[]) {
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
        tailIndex = lineIndex

        while (
          tailIndex-- &&
          events[tailIndex][1].end.offset > events[lineIndex][1].start.offset
        ) {
          events[tailIndex][1].end = shallow(events[lineIndex][1].start)
        }

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

function unravelLinkedTokens(token: any, context: any) {
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

function divideTokens(token: any) {
  var events = token._tokenizer.events
  var tail = events.pop()
  var lineIndex = events.length
  var lineEnd
  var seenEnter

  assert.equal(tail, codes.eof, 'expected eof token')

  while (lineIndex--) {
    if (events[lineIndex][0] === 'enter') {
      seenEnter = true
    } else if (
      seenEnter &&
      (events[lineIndex][1].type === types.codeTextPaddingLineEnding ||
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
