module.exports = subtokenize

var assert = require('assert')
var codes = require('../character/codes')
var chunkedSplice = require('./chunked-splice')
var types = require('../constant/types')
var flatMap = require('./flat-map')
var shallow = require('./shallow')

function subtokenize(events) {
  var index = -1
  var isInFirstContentOfListItem
  var more
  var event
  var lineIndex
  var subevents
  var otherIndex
  var otherEvent
  var slice

  while (++index < events.length) {
    event = events[index]

    if (event === codes.eof) {
      break
    }

    if (event[0] === 'enter') {
      subevents = event[1]._subevents

      if (event[1].type === types.chunkText) {
        event[1]._gfmTasklistFirstContentOfListItem = isInFirstContentOfListItem
      }

      if (subevents) {
        assert.equal(
          event[1].type,
          events[index + 1][1].type,
          'expected a void token'
        )

        chunkedSplice(events, index, 2, subevents)
        index += subevents.length - 1
        event[1]._subevents = undefined
        more = true
      } else if (event[1].contentType && !event[1]._contentTokenized) {
        unravelLinkedTokens(event[1], event[2])

        // Iterate over this token again, so we’ll hit `_subevents` above.
        index--
      }
    } else if (event[1].type === types.listItemPrefix) {
      otherIndex = index

      while (++otherIndex < events.length) {
        // Skip past blank line endings and list item indent.
        if (
          events[otherIndex][1].type === types.lineEndingBlank ||
          events[otherIndex][1].type === types.listItemIndent
        ) {
          continue
        }

        if (events[otherIndex][1].type === types.content) {
          isInFirstContentOfListItem = true
        }

        break
      }
    } else if (event[1].type === types.content) {
      isInFirstContentOfListItem = false
    }
    // If this is an exit of a container:
    else if (event[1]._container) {
      otherIndex = index
      lineIndex = undefined

      while (otherIndex--) {
        otherEvent = events[otherIndex]

        if (
          otherEvent[1].type === types.lineEnding ||
          otherEvent[1].type === types.lineEndingBlank
        ) {
          if (otherEvent[0] === 'exit') continue

          if (lineIndex) {
            events[lineIndex][1].type = types.lineEndingBlank
          }

          otherEvent[1].type = types.lineEnding
          lineIndex = otherIndex
        } else {
          break
        }
      }

      if (lineIndex) {
        otherIndex = lineIndex

        while (
          otherIndex-- &&
          events[otherIndex][1].end.offset > events[lineIndex][1].start.offset
        ) {
          events[otherIndex][1].end = shallow(events[lineIndex][1].start)
        }

        // Fix position.
        event[1].end = shallow(events[lineIndex][1].start)

        // Switch container exit w/ line endings.
        slice = events.slice(lineIndex, index)
        slice.unshift(event)
        chunkedSplice(events, lineIndex, index - lineIndex + 1, slice)
        index = lineIndex
      }
    }
  }

  return {done: !more, events: events}
}

function unravelLinkedTokenImplementation(token, context) {
  var hasGfmTaskListHack = token._gfmTasklistFirstContentOfListItem
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
      stream.push(codes.eof)
    }

    if (hasGfmTaskListHack) {
      tokenizer._gfmTasklistFirstContentOfListItem = true
    }

    flatMap(stream, tokenizer.write)
  }

  token._contentTokenized = true

  if (hasGfmTaskListHack) {
    tokenizer._gfmTasklistFirstContentOfListItem = false
  }
}

function unravelLinkedTokens(token, context) {
  while (token) {
    // Loop over the tokens because a recursive function would cause a stackoverflow
    unravelLinkedTokenImplementation(token, context)
    if (!token.next) {
      // Done!
      divideTokens(token)
    }

    // Unravel the next token.
    token = token.next
  }
}

function divideTokens(token) {
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
