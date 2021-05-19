/**
 * @typedef {import('../types.js').Token} Token
 * @typedef {import('../types.js').Chunk} Chunk
 * @typedef {import('../types.js').Event} Event
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {assign} from '../constant/assign.js'
import {types} from '../constant/types.js'
import {chunkedSplice} from './chunked-splice.js'
import {shallow} from './shallow.js'

/**
 * Tokenize subcontent.
 *
 * @param {Event[]} events
 * @returns {boolean}
 */
export function subtokenize(events) {
  /** @type {Record<string, number>} */
  const jumps = {}
  let index = -1
  /** @type {Event} */
  let event
  /** @type {number|undefined} */
  let lineIndex
  /** @type {number} */
  let otherIndex
  /** @type {Event} */
  let otherEvent
  /** @type {Event[]} */
  let parameters
  /** @type {Event[]} */
  let subevents
  /** @type {boolean|undefined} */
  let more

  while (++index < events.length) {
    while (index in jumps) {
      index = jumps[index]
    }

    event = events[index]

    // Add a hook for the GFM tasklist extension, which needs to know if text
    // is in the first content of a list item.
    if (
      index &&
      event[1].type === types.chunkFlow &&
      events[index - 1][1].type === types.listItemPrefix
    ) {
      assert(event[1]._tokenizer, 'expected `_tokenizer` on subtokens')
      subevents = event[1]._tokenizer.events
      otherIndex = 0

      if (
        otherIndex < subevents.length &&
        subevents[otherIndex][1].type === types.lineEndingBlank
      ) {
        otherIndex += 2
      }

      if (
        otherIndex < subevents.length &&
        subevents[otherIndex][1].type === types.content
      ) {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === types.content) {
            break
          }

          if (subevents[otherIndex][1].type === types.chunkText) {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true
            otherIndex++
          }
        }
      }
    }

    // Enter.
    if (event[0] === 'enter') {
      if (event[1].contentType) {
        assign(jumps, subcontent(events, index))
        index = jumps[index]
        more = true
      }
    }
    // Exit.
    else if (event[1]._container) {
      otherIndex = index
      lineIndex = undefined

      while (otherIndex--) {
        otherEvent = events[otherIndex]

        if (
          otherEvent[1].type === types.lineEnding ||
          otherEvent[1].type === types.lineEndingBlank
        ) {
          if (otherEvent[0] === 'enter') {
            if (lineIndex) {
              events[lineIndex][1].type = types.lineEndingBlank
            }

            otherEvent[1].type = types.lineEnding
            lineIndex = otherIndex
          }
        } else {
          break
        }
      }

      if (lineIndex) {
        // Fix position.
        event[1].end = shallow(events[lineIndex][1].start)

        // Switch container exit w/ line endings.
        parameters = events.slice(lineIndex, index)
        parameters.unshift(event)
        chunkedSplice(events, lineIndex, index - lineIndex + 1, parameters)
      }
    }
  }

  return !more
}

/**
 * Tokenize embedded tokens.
 *
 * @param {Event[]} events
 * @param {number} eventIndex
 * @returns {Record<string, number>}
 */
function subcontent(events, eventIndex) {
  /** @type {Token} */
  let token = events[eventIndex][1]
  const context = events[eventIndex][2]
  let startPosition = eventIndex - 1
  /** @type {number[]} */
  const startPositions = []
  assert(token.contentType, 'expected `contentType` on subtokens')
  const tokenizer =
    token._tokenizer || context.parser[token.contentType](token.start)
  const childEvents = tokenizer.events
  /** @type {[number, number][]} */
  const jumps = []
  /** @type {Record<string, number>} */
  const gaps = {}
  /** @type {Chunk[]} */
  let stream
  /** @type {Token|undefined} */
  let previous
  /** @type {number} */
  let index
  /** @type {boolean|undefined} */
  let entered
  /** @type {number|undefined} */
  let end
  /** @type {number} */
  let adjust

  /** @type {Token|undefined} */
  let current = token

  // Loop forward through the linked tokens to pass them in order to the
  // subtokenizer.
  while (current) {
    // Find the position of the event for this token.
    while (events[++startPosition][1] !== current) {
      // Empty.
    }

    startPositions.push(startPosition)

    if (!current._tokenizer) {
      stream = context.sliceStream(current)

      if (!current.next) {
        stream.push(codes.eof)
      }

      if (previous) {
        tokenizer.defineSkip(current.start)
      }

      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true
      }

      tokenizer.write(stream)

      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = undefined
      }
    }

    // Unravel the next token.
    previous = current
    current = current.next
  }

  // Now, loop back through all events (and linked tokens), to figure out which
  // parts belong where.
  // @ts-expect-error Assume at least one `previous` is set.
  token = previous
  index = childEvents.length

  while (index--) {
    // Make sure we’ve at least seen something (final eol is part of the last
    // token).
    if (childEvents[index][0] === 'enter') {
      entered = true
    } else if (
      // Find a void token that includes a break.
      entered &&
      childEvents[index][1].type === childEvents[index - 1][1].type &&
      childEvents[index][1].start.line !== childEvents[index][1].end.line
    ) {
      add(childEvents.slice(index + 1, end))
      assert(token.previous, 'expected a previous token')
      // Help GC.
      token._tokenizer = undefined
      token.next = undefined
      token = token.previous
      end = index + 1
    }
  }

  assert(!token.previous, 'expected no previous token')
  // Help GC.
  tokenizer.events = []
  token._tokenizer = undefined
  token.next = undefined

  // Do head:
  add(childEvents.slice(0, end))

  index = -1
  adjust = 0

  while (++index < jumps.length) {
    gaps[adjust + jumps[index][0]] = adjust + jumps[index][1]
    adjust += jumps[index][1] - jumps[index][0] - 1
  }

  return gaps

  /**
   * @param {Event[]} slice
   * @returns {void}
   */
  function add(slice) {
    const start = startPositions.pop()
    assert(start !== undefined, 'expected a start position when calling `add`')
    jumps.unshift([start, start + slice.length - 1])
    chunkedSplice(events, start, 2, slice)
  }
}
