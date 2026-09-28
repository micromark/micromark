/**
 * @import {
 *   Code,
 *   Construct,
 *   Event,
 *   Point,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {push, splice} from 'micromark-util-chunked'
import {classifyCharacter} from 'micromark-util-classify-character'
import {resolveAll} from 'micromark-util-resolve-all'
import {codes, constants, types} from 'micromark-util-symbol'

/** @type {Construct} */
export const attention = {
  name: 'attention',
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
}

/**
 * Take all events and resolve attention to emphasis or strong.
 *
 * @type {Resolver}
 */
// eslint-disable-next-line complexity
function resolveAllAttention(events, context) {
  let index = -1
  /** @type {Array<Event>} */
  let nextEvents
  // Events are moved to `left` as they are walked, and splices happen there,
  // near its end, so that the rest of `events` is never shifted.
  /** @type {Array<Event>} */
  const left = []
  let read = 0

  // Walk through all events.
  //
  // Note: performance of this is fine on an mb of normal markdown, but it’s
  // a bottleneck for malicious stuff.
  while (++index < left.length + events.length - read) {
    // Make sure the event at `index` and the one after it are in `left`.
    while (left.length < index + 2 && read < events.length) {
      left.push(events[read++])
    }

    // Find a token that can close.
    if (
      left[index][0] === 'enter' &&
      left[index][1].type === 'attentionSequence' &&
      left[index][1]._close
    ) {
      let open = index

      // Now walk back to find an opener.
      while (open--) {
        // Find a token that can open the closer.
        if (
          left[open][0] === 'exit' &&
          left[open][1].type === 'attentionSequence' &&
          left[open][1]._open &&
          // If the markers are the same:
          context.sliceSerialize(left[open][1]).charCodeAt(0) ===
            context.sliceSerialize(left[index][1]).charCodeAt(0)
        ) {
          // If the opening can close or the closing can open,
          // and the close size *is not* a multiple of three,
          // but the sum of the opening and closing size *is* multiple of three,
          // then don’t match.
          if (
            (left[open][1]._close || left[index][1]._open) &&
            (left[index][1].end.offset - left[index][1].start.offset) % 3 &&
            !(
              (left[open][1].end.offset -
                left[open][1].start.offset +
                left[index][1].end.offset -
                left[index][1].start.offset) %
              3
            )
          ) {
            continue
          }

          // Number of markers to use from the sequence.
          const use =
            left[open][1].end.offset - left[open][1].start.offset > 1 &&
            left[index][1].end.offset - left[index][1].start.offset > 1
              ? 2
              : 1

          const start = {...left[open][1].end}
          const end = {...left[index][1].start}
          movePoint(start, -use)
          movePoint(end, use)

          const openingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start,
            end: {...left[open][1].end}
          }
          const closingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start: {...left[index][1].start},
            end
          }
          const text = {
            type: use > 1 ? types.strongText : types.emphasisText,
            start: {...left[open][1].end},
            end: {...left[index][1].start}
          }
          const group = {
            type: use > 1 ? types.strong : types.emphasis,
            start: {...openingSequence.start},
            end: {...closingSequence.end}
          }

          left[open][1].end = {...openingSequence.start}
          left[index][1].start = {...closingSequence.end}

          nextEvents = []

          // If there are more markers in the opening, add them before.
          if (left[open][1].end.offset - left[open][1].start.offset) {
            nextEvents = push(nextEvents, [
              ['enter', left[open][1], context],
              ['exit', left[open][1], context]
            ])
          }

          // Opening.
          nextEvents = push(nextEvents, [
            ['enter', group, context],
            ['enter', openingSequence, context],
            ['exit', openingSequence, context],
            ['enter', text, context]
          ])

          // Always populated by defaults.
          assert(
            context.parser.constructs.insideSpan.null,
            'expected `insideSpan` to be populated'
          )

          // Between.
          nextEvents = push(
            nextEvents,
            resolveAll(
              context.parser.constructs.insideSpan.null,
              left.slice(open + 1, index),
              context
            )
          )

          // Closing.
          nextEvents = push(nextEvents, [
            ['exit', text, context],
            ['enter', closingSequence, context],
            ['exit', closingSequence, context],
            ['exit', group, context]
          ])

          /** @type {number} */
          let offset = 0

          // If there are more markers in the closing, add them after.
          if (left[index][1].end.offset - left[index][1].start.offset) {
            offset = 2
            nextEvents = push(nextEvents, [
              ['enter', left[index][1], context],
              ['exit', left[index][1], context]
            ])
          }

          splice(left, open - 1, index - open + 3, nextEvents)

          index = open + nextEvents.length - offset - 2
          break
        }
      }
    }
  }

  // Replace the walked events with the resolved ones.
  splice(events, 0, read, left)

  // Remove remaining sequences.
  index = -1

  while (++index < events.length) {
    if (events[index][1].type === 'attentionSequence') {
      events[index][1].type = 'data'
    }
  }

  return events
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeAttention(effects, ok) {
  const attentionMarkers = this.parser.constructs.attentionMarkers.null
  const previous = this.previous
  const before = classifyCharacter(previous)

  /** @type {NonNullable<Code>} */
  let marker

  return start

  /**
   * Before a sequence.
   *
   * ```markdown
   * > | **
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(
      code === codes.asterisk || code === codes.underscore,
      'expected asterisk or underscore'
    )
    marker = code
    effects.enter('attentionSequence')
    return inside(code)
  }

  /**
   * In a sequence.
   *
   * ```markdown
   * > | **
   *     ^^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    if (code === marker) {
      effects.consume(code)
      return inside
    }

    const token = effects.exit('attentionSequence')

    // To do: next major: move this to resolver, just like `markdown-rs`.
    const after = classifyCharacter(code)

    // Always populated by defaults.
    assert(attentionMarkers, 'expected `attentionMarkers` to be populated')

    // Note: `*` and `_` are in `attentionMarkers` through core.
    // They are excluded here as the loosening is meant for markers registered
    // by *other* constructs (such as GFM strikethrough’s `~`).
    const open =
      !after ||
      (after === constants.characterGroupPunctuation && before) ||
      (attentionMarkers.includes(code) &&
        code !== codes.asterisk &&
        code !== codes.underscore)
    const close =
      !before ||
      (before === constants.characterGroupPunctuation && after) ||
      (attentionMarkers.includes(previous) &&
        previous !== codes.asterisk &&
        previous !== codes.underscore)

    token._open = Boolean(
      marker === codes.asterisk ? open : open && (before || !close)
    )
    token._close = Boolean(
      marker === codes.asterisk ? close : close && (after || !open)
    )
    return ok(code)
  }
}

/**
 * Move a point a bit.
 *
 * Note: `move` only works inside lines! It’s not possible to move past other
 * chunks (replacement characters, tabs, or line endings).
 *
 * @param {Point} point
 *   Point.
 * @param {number} offset
 *   Amount to move.
 * @returns {undefined}
 *   Nothing.
 */
function movePoint(point, offset) {
  point.column += offset
  point.offset += offset
  point._bufferIndex += offset
}
