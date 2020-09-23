exports.tokenize = tokenizeAttention
exports.resolveAll = resolveAllAttention

var codes = require('../character/codes')
var constants = require('../constant/constants')
var types = require('../constant/types')
var shallow = require('../util/shallow')
var classifyCharacter = require('../util/classify-character')
var resolveAll = require('../util/resolve-all')
var movePoint = require('../util/move-point')

// Internal type for markers that could turn into emphasis or strong sequences.
var attentionSequence = 'attentionSequence'

// Take all events and resolve attention to emphasis or strong.
function resolveAllAttention(events, context) {
  var length = events.length
  var index = -1
  var attention
  var opening
  var closing
  var text
  var indexOpen
  var eventsUpTo
  var use
  var openingSequence
  var closingSequence

  // Walk through all events.
  while (++index < length) {
    closing = events[index][1]

    // Find a token that can close.
    if (
      events[index][0] === 'enter' &&
      closing.type === attentionSequence &&
      closing._close
    ) {
      indexOpen = index

      // Now walk back to find an opener.
      while (indexOpen--) {
        opening = events[indexOpen][1]

        // Find a token that can open the closer.
        if (
          events[indexOpen][0] === 'exit' &&
          opening.type === attentionSequence &&
          opening._open &&
          // If the markers are the same:
          context.sliceSerialize(opening).charCodeAt(0) ===
            context.sliceSerialize(closing).charCodeAt(0)
        ) {
          // If the opening can close or the closing can open,
          // and the close size *is not* a multiple of three,
          // but the sum of the opening and closing size *is* multiple of three,
          // then don’t match.
          if (
            (opening._close || closing._open) &&
            (closing.end.offset - closing.start.offset) % 3 &&
            !(
              (opening.end.offset -
                opening.start.offset +
                closing.end.offset -
                closing.start.offset) %
              3
            )
          ) {
            continue
          }

          // Number of markers to use from the sequence.
          use =
            opening.end.offset - opening.start.offset > 1 &&
            closing.end.offset - closing.start.offset > 1
              ? 2
              : 1

          openingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start: movePoint(shallow(opening.end), -use),
            end: shallow(opening.end)
          }
          closingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start: shallow(closing.start),
            end: movePoint(shallow(closing.start), use)
          }
          text = {
            type: use > 1 ? types.strongText : types.emphasisText,
            start: shallow(openingSequence.end),
            end: shallow(closingSequence.start)
          }
          attention = {
            type: use > 1 ? types.strong : types.emphasis,
            start: shallow(openingSequence.start),
            end: shallow(closingSequence.end)
          }

          opening.end = shallow(openingSequence.start)
          closing.start = shallow(closingSequence.end)

          eventsUpTo = [].concat(
            // Before.
            events.slice(0, indexOpen - 1),
            // If there are more markers in the opening, add them before.
            opening.end.offset - opening.start.offset
              ? [
                  ['enter', opening, context],
                  ['exit', opening, context]
                ]
              : [],
            // Opening.
            [
              ['enter', attention, context],
              ['enter', openingSequence, context],
              ['exit', openingSequence, context],
              ['enter', text, context]
            ],
            // Between.
            resolveAll(
              context.parser.constructs.insideSpan.null,
              events.slice(indexOpen + 1, index),
              context
            ),
            // Closing.
            [
              ['exit', text, context],
              ['enter', closingSequence, context],
              ['exit', closingSequence, context],
              ['exit', attention, context]
            ]
          )

          // After.
          events = eventsUpTo.concat(
            // If there are more markers in the closing, add them after.
            closing.end.offset - closing.start.offset
              ? [
                  ['enter', closing, context],
                  ['exit', closing, context]
                ]
              : [],
            events.slice(index + 2)
          )

          length = events.length
          index = eventsUpTo.length - 1
          break
        }
      }
    }
  }

  return removeRemainingSequences(events)
}

function removeRemainingSequences(events) {
  var index = -1
  var length = events.length

  while (++index < length) {
    if (events[index][1].type === attentionSequence) {
      events[index][1].type = 'data'
    }
  }

  return events
}

function tokenizeAttention(effects, ok, nok) {
  var before = classifyCharacter(this.previous)
  var marker

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.asterisk && code !== codes.underscore) {
      return nok(code)
    }

    effects.enter(attentionSequence)
    marker = code
    return more(code)
  }

  function more(code) {
    var after
    var open
    var close
    var originalOpen

    if (code === marker) {
      effects.consume(code)
      return more
    }

    after = classifyCharacter(code)
    open = !after || (before && after === constants.characterGroupPunctuation)
    close = !before || (after && before === constants.characterGroupPunctuation)

    if (marker === codes.underscore) {
      originalOpen = open
      open = open && (before || !close)
      close = close && (after || !originalOpen)
    }

    effects.exit(attentionSequence, {_open: open, _close: close})

    return ok(code)
  }
}
