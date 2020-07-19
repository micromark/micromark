exports.tokenize = tokenizeEmphasis
exports.resolveAll = resolveAllEmphasis

var codes = require('../../character/codes')
var constants = require('../../constant/constants')
var splice = require('../../constant/splice')
var clone = require('../../util/clone-point')
var move = require('../../util/move-point')
var unicodePunctuation = require('../../character/unicode-punctuation')
var unicodeWhitespace = require('../../character/unicode-whitespace')

// Take all events and resolve emphasis in them.
// Note that this algorithm is made for a configurable `stackBottom`, however,
// we don’t use it.
// To do: clean the code!
// To do: support tokens in multiple chunks (removing them when used up, moving
// them, etc.)
// eslint-disable-next-line complexity
function resolveAllEmphasis(events) {
  var stackBottom
  var lastSequence
  var index = -1
  var length = events.length
  var token
  var event
  var previous
  var subevents
  var opener
  var closer
  var oldCloser
  var size
  var after
  var openerFound
  var openersBottom
  var type
  var point
  var marker

  // Create a double linked list from the sequences.
  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === 'emphasisSequence') {
      subevents = []
      token.events = subevents
      previous = lastSequence

      lastSequence = {
        token: token,
        size: token.size,
        events: subevents,
        previous: previous
      }

      if (previous !== undefined) {
        previous.next = lastSequence
      }
    }
  }

  // Track openers of the different markers: 0 (both), 1 (emphasis), 2 (strong).
  openersBottom = {}
  openersBottom[codes.asterisk] = [stackBottom, stackBottom, stackBottom]
  openersBottom[codes.underscore] = [stackBottom, stackBottom, stackBottom]

  // Move backwards and find the closer above `stackBottom`.
  // As `stackBottom` is always `undefined`, because we don’t support passing
  // it, this can be optimized by tracking the first sequence instead and
  // dropping the whole loop.
  closer = lastSequence

  while (closer !== undefined && closer.previous !== stackBottom) {
    closer = closer.previous
  }

  // From the first sequence, move forwards and find a closer.
  while (closer !== undefined) {
    if (!closer.token.canClose) {
      closer = closer.next
      continue
    }

    // When we have a closer, move backwards for an opener.
    marker = closer.token.marker

    opener = closer.previous
    openerFound = false

    while (
      opener !== undefined &&
      opener !== stackBottom &&
      opener !== openersBottom[marker][closer.token.size % 3]
    ) {
      if (
        opener.token.marker === closer.token.marker &&
        opener.token.canOpen &&
        !(
          (closer.token.canOpen || opener.token.canClose) &&
          closer.token.size % 3 !== 0 &&
          (opener.token.size + closer.token.size) % 3 === 0
        )
      ) {
        openerFound = true
        break
      }

      opener = opener.previous
    }

    oldCloser = closer

    if (openerFound === true) {
      // Number of markers to use from the sequence.
      size = closer.size > 1 && opener.size > 1 ? 2 : 1
      type = size === 1 ? 'emphasis' : 'strong'

      // Remove used size.
      opener.size -= size
      closer.size -= size

      // To do: move across chunks.
      point = move(clone(opener.token.start), size)
      opener.events.unshift([
        'enter',
        {type: type, start: opener.token.start, end: point}
      ])
      opener.token.start = clone(point)
      opener.token.side = constants.emphasisSideBefore

      // To do: move across chunks.
      point = move(clone(closer.token.end), -size)
      closer.events.push([
        'exit',
        {type: type, start: point, end: closer.token.end}
      ])
      closer.token.end = clone(point)
      closer.token.side = constants.emphasisSideAfter

      // Remove sequences between `opener` and `closer`.
      opener.next = closer
      closer.previous = opener

      if (opener.size === 0) {
        unlink(opener)
      }

      if (closer.size === 0) {
        after = closer.next
        unlink(closer)
        closer = after
      }
    } else {
      closer = closer.next
    }

    if (!openerFound) {
      // Set lower bound for future searches for openers.
      openersBottom[marker][oldCloser.token.size % 3] = oldCloser.previous

      // We can unlink a closer that cannot be an opener, once we’ve seen
      // there’s no matching opener.
      if (!oldCloser.token.canOpen) {
        unlink(oldCloser)
      }
    }
  }

  // Unlink remaining sequences.
  while (lastSequence !== undefined && lastSequence !== stackBottom) {
    unlink(lastSequence)
  }

  length = events.length
  index = 0

  while (index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === 'emphasisSequence') {
      subevents = token.events

      // If there is some or all of the token remaining:
      if (token.start.bufferIndex !== token.end.bufferIndex) {
        token.type = 'data'
        events[index + 1][1].type = 'data'

        subevents[
          token.side === constants.emphasisSideBefore ? 'unshift' : 'push'
        ](event, events[index + 1])
      }

      splice.apply(events, [index, 2].concat(subevents))
      index += subevents.length
      length = length - 2 + subevents.length
    } else {
      index++
    }
  }

  return events

  function unlink(sequence) {
    if (sequence.previous !== undefined) {
      sequence.previous.next = sequence.next
    }

    if (sequence.next === undefined) {
      lastSequence = sequence.previous
    } else {
      sequence.next.previous = sequence.previous
    }
  }
}

function tokenizeEmphasis(effects, ok, nok) {
  var size = 0
  var before
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.asterisk && code !== codes.underscore) {
      return nok(code)
    }

    marker = code
    before = classify(effects.previous)

    effects.enter('emphasisSequence')
    effects.consume(code)
    size++

    return open
  }

  function open(code) {
    var token
    var after
    var leftFlanking
    var rightFlanking
    var canOpen
    var canClose

    if (code === marker) {
      effects.consume(code)
      size++
      return open
    }

    token = effects.exit('emphasisSequence')
    token.marker = marker

    after = classify(code)

    // To do: optimize.
    leftFlanking =
      after !== constants.characterGroupWhitespace &&
      (after !== constants.characterGroupPunctuation ||
        before === constants.characterGroupWhitespace ||
        before === constants.characterGroupPunctuation)
    rightFlanking =
      before !== constants.characterGroupWhitespace &&
      (before !== constants.characterGroupPunctuation ||
        after === constants.characterGroupWhitespace ||
        after === constants.characterGroupPunctuation)

    if (marker === codes.asterisk) {
      canOpen = leftFlanking
      canClose = rightFlanking
    } else {
      canOpen =
        leftFlanking &&
        (!rightFlanking || before === constants.characterGroupPunctuation)
      canClose =
        rightFlanking &&
        (!leftFlanking || after === constants.characterGroupPunctuation)
    }

    token.canOpen = canOpen
    token.canClose = canClose
    token.size = size

    return ok(code)
  }
}

function classify(code) {
  if (
    code === codes.eof ||
    code === codes.cr ||
    code === codes.lf ||
    code === codes.crlf ||
    unicodeWhitespace(code)
  ) {
    return constants.characterGroupWhitespace
  }

  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation
  }
}
