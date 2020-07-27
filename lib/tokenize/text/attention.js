exports.tokenize = tokenizeAttention
exports.resolveAll = resolveAllAttention

var codes = require('../../character/codes')
var constants = require('../../constant/constants')
var splice = require('../../constant/splice')
var types = require('../../constant/types')
var shallow = require('../../util/shallow')
var move = require('../../util/move-point')
var classifyCharacter = require('../../util/classify-character')

// Internal type for markers that could turn into emphasis or strong sequences.
var attention = 'attention'

// Take all events and resolve attention to emphasis or strong.
// Note that this algorithm is made for a configurable `stackBottom`, however,
// we don’t use it.
// To do: clean the code!
// To do: support tokens in multiple chunks (removing them when used up, moving
// them, etc.)
// eslint-disable-next-line complexity
function resolveAllAttention(events, helpers) {
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
  var openerToken
  var attentionToken
  var sequenceToken
  var dataToken
  var type
  var point
  var marker

  // Create a double linked list from the sequences.
  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === attention) {
      previous = lastSequence
      lastSequence = {token: token, size: token._size, previous: previous}

      if (previous) {
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

  while (closer && closer.previous !== stackBottom) {
    closer = closer.previous
  }

  // From the first sequence, move forwards and find a closer.
  while (closer) {
    token = closer.token

    if (!token._close) {
      closer = closer.next
      continue
    }

    // When we have a closer, move backwards for an opener.
    marker = token._marker

    opener = closer.previous
    openerFound = undefined

    while (
      opener !== stackBottom &&
      opener !== openersBottom[marker][token._size % 3]
    ) {
      openerToken = opener.token

      if (
        openerToken._marker === marker &&
        openerToken._open &&
        !(
          (token._open || openerToken._close) &&
          token._size % 3 &&
          !((openerToken._size + token._size) % 3)
        )
      ) {
        openerFound = true
        break
      }

      opener = opener.previous
    }

    oldCloser = closer

    if (openerFound) {
      // Number of markers to use from the sequence.
      size = closer.size > 1 && opener.size > 1 ? 2 : 1
      type = size === 1 ? types.emphasis : types.strong

      // Remove used size.
      opener.size -= size
      closer.size -= size

      // To do: move across chunks.
      point = move(shallow(openerToken.start), size)

      attentionToken = {type: type, start: openerToken.start, end: token.end}

      dataToken = {
        type: size === 1 ? types.emphasisText : types.strongText,
        start: shallow(point)
      }

      sequenceToken = {
        type: size === 1 ? types.emphasisSequence : types.strongSequence,
        start: shallow(openerToken.start),
        end: shallow(point)
      }

      openerToken._events.unshift(
        ['enter', attentionToken, helpers],
        ['enter', sequenceToken, helpers],
        ['exit', sequenceToken, helpers],
        ['enter', dataToken, helpers]
      )
      openerToken.start = point
      openerToken._side = constants.attentionSideBefore

      point = move(shallow(token.end), -size)

      dataToken.end = shallow(point)

      sequenceToken = {
        type: sequenceToken.type,
        start: shallow(point),
        end: shallow(token.end)
      }

      token._events.push(
        ['exit', dataToken, helpers],
        ['enter', sequenceToken, helpers],
        ['exit', sequenceToken, helpers],
        ['exit', attentionToken, helpers]
      )
      token.end = point
      token._side = constants.attentionSideAfter

      // Remove sequences between `opener` and `closer`.
      opener.next = closer
      closer.previous = opener

      if (!opener.size) {
        unlink(opener)
      }

      if (!closer.size) {
        after = closer.next
        unlink(closer)
        closer = after
      }
    } else {
      closer = closer.next
    }

    if (!openerFound) {
      // Set lower bound for future searches for openers.
      openersBottom[marker][token._size % 3] = oldCloser.previous

      // We can unlink a closer that cannot be an opener, once we’ve seen
      // there’s no matching opener.
      if (!token._open) {
        unlink(oldCloser)
      }
    }
  }

  // Unlink remaining sequences.
  while (lastSequence && lastSequence !== stackBottom) {
    unlink(lastSequence)
  }

  length = events.length
  index = 0

  while (index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === attention) {
      subevents = token._events

      // If there is some or all of the token remaining:
      if (token.start.bufferIndex !== token.end.bufferIndex) {
        dataToken = {type: types.data, start: token.start, end: token.end}
        subevents[
          token._side === constants.attentionSideBefore ? 'unshift' : 'push'
        ](['enter', dataToken, helpers], ['exit', dataToken, helpers])
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
    var previous = sequence.previous
    var next = sequence.next

    if (previous) {
      previous.next = next
    }

    if (next) {
      next.previous = previous
    } else {
      lastSequence = previous
    }
  }
}

function tokenizeAttention(effects, ok, nok) {
  var before = classifyCharacter(this.previous)
  var size
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
    if (code !== codes.asterisk && code !== codes.underscore) {
      return nok(code)
    }

    effects.enter(attention)
    marker = code
    size = 0
    return more(code)
  }

  function more(code) {
    var token
    var after
    var open
    var close
    var originalOpen

    if (code === marker) {
      effects.consume(code)
      size++
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

    token = effects.exit(attention)
    token._events = []
    token._marker = marker
    token._open = open
    token._close = close
    token._size = size

    return ok(code)
  }
}
