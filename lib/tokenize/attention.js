exports.tokenize = tokenizeAttention
exports.resolveAll = resolveAllAttention

var codes = require('../character/codes')
var constants = require('../constant/constants')
var splice = require('../constant/splice')
var types = require('../constant/types')
var shallow = require('../util/shallow')
var move = require('../util/move-point')
var classifyCharacter = require('../util/classify-character')

// Internal type for markers that could turn into emphasis or strong sequences.
var attention = 'attention'

// Take all events and resolve attention to emphasis or strong.
// To do: support tokens in multiple chunks (removing them when used up, moving
// them, etc.)
function resolveAllAttention(events, context) {
  var length = events.length
  var index = -1
  var event
  var token
  var lastSequence
  var previous
  var subevents
  var opener
  var closer
  var oldCloser
  var use
  var after
  var openerFound
  var openersBottom
  var openerToken
  var attentionToken
  var sequenceToken
  var dataToken
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
      } else {
        // Head.
        closer = lastSequence
      }
    }
  }

  // Track openers of the different markers: `0` is used for both, `1` for
  // emphasis, and `2` for strong.
  openersBottom = {}
  openersBottom[codes.asterisk] = []
  openersBottom[codes.underscore] = []

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

    while (opener && opener !== openersBottom[marker][token._size % 3]) {
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
      use = closer.size > 1 && opener.size > 1 ? 2 : 1

      // Remove used size.
      opener.size -= use
      closer.size -= use

      // New token.
      attentionToken = {
        type: use === 1 ? types.emphasis : types.strong,
        start: openerToken.start,
        end: token.end
      }

      point = move(shallow(openerToken.start), use)
      dataToken = {
        type: use === 1 ? types.emphasisText : types.strongText,
        start: shallow(point)
      }
      sequenceToken = {
        type: use === 1 ? types.emphasisSequence : types.strongSequence,
        start: shallow(openerToken.start),
        end: shallow(point)
      }
      openerToken._events.unshift(
        ['enter', attentionToken, context],
        ['enter', sequenceToken, context],
        ['exit', sequenceToken, context],
        ['enter', dataToken, context]
      )
      openerToken.start = point
      openerToken._side = constants.attentionSideBefore

      point = move(shallow(token.end), -use)
      dataToken.end = shallow(point)
      sequenceToken = {
        type: sequenceToken.type,
        start: shallow(point),
        end: shallow(token.end)
      }
      token._events.push(
        ['exit', dataToken, context],
        ['enter', sequenceToken, context],
        ['exit', sequenceToken, context],
        ['exit', attentionToken, context]
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

  length = events.length
  index = -1

  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === attention) {
      subevents = token._events

      // If there is some or all of the token remaining:
      if (token.start.bufferIndex !== token.end.bufferIndex) {
        dataToken = {type: types.data, start: token.start, end: token.end}
        subevents[
          token._side === constants.attentionSideBefore ? 'unshift' : 'push'
        ](['enter', dataToken, context], ['exit', dataToken, context])
      }

      splice.apply(events, [index, 2].concat(subevents))
      index += subevents.length - 1
      length = events.length
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
    // istanbul ignore next - Hooks.
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
