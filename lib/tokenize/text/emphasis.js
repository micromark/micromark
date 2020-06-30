exports.tokenize = tokenizeEmphasis
exports.resolveAll = resolveAllEmphasis

var characters = require('../../util/characters')
var clone = require('../../util/clone-point')
var move = require('../../util/move-point')
var unicodePunctuation = require('../../character/group/unicode-punctuation')
var unicodeWhitespace = require('../../character/group/unicode-whitespace')

// To do: clean the code!
// To do: support tokens in multiple chunks (removing them when used up, moving
// them, etc.)
// eslint-disable-next-line complexity
function resolveAllEmphasis(events) {
  var stackBottom = null
  var last = null

  // Create a double linked list.
  events.forEach(([name, token]) => {
    var previous
    var events

    if (name === 'enter' && token.type === 'emphasisSequence') {
      events = []
      token.events = events
      previous = last

      last = {
        t: token,
        size: token.size,
        events: events,
        previous: previous,
        next: null
      }

      if (previous !== null) {
        previous.next = last
      }
    }
  })

  var opener
  var closer
  var oldCloser
  // var openerInl
  // var closerInl
  // var tempstack
  var useDelims
  var after
  // var next
  var openerFound
  var openersBottom = []
  var bottom
  var type
  var point
  var marker

  // To do: refactor, can this be cleaner?
  for (var i = 0; i < 3; i++) {
    bottom = {}
    bottom[characters.asterisk] = stackBottom
    bottom[characters.underscore] = stackBottom
    openersBottom[i] = bottom
  }

  // Find first closer above stackBottom:
  closer = last

  while (closer !== null && closer.previous !== stackBottom) {
    closer = closer.previous
  }

  // move forward, looking for closers, and handling each
  while (closer !== null) {
    if (!closer.t.canClose) {
      closer = closer.next
      continue
    }

    // Sound emphasis closer.
    marker = closer.t.marker

    // Now look back for first matching opener:
    opener = closer.previous
    openerFound = false

    while (
      opener !== null &&
      opener !== stackBottom &&
      opener !== openersBottom[closer.t.size % 3][marker]
    ) {
      if (
        opener.t.marker === closer.t.marker &&
        opener.t.canOpen &&
        !(
          (closer.t.canOpen || opener.t.canClose) &&
          closer.t.size % 3 !== 0 &&
          (opener.t.size + closer.t.size) % 3 === 0
        )
      ) {
        openerFound = true
        break
      }

      opener = opener.previous
    }

    oldCloser = closer

    if (openerFound) {
      // Calculate number of delimiters used from closer.
      useDelims = closer.size >= 2 && opener.size >= 2 ? 2 : 1

      // Remove used delimiters from stack elts and inlines
      opener.size -= useDelims
      closer.size -= useDelims

      type = useDelims === 1 ? 'emphasis' : 'strong'

      console.log('mv:open', opener.t.start, useDelims)
      point = move(clone(opener.t.start), useDelims)
      opener.events.unshift([
        'enter',
        {type: type, start: opener.t.start, end: point}
      ])
      opener.t.start = clone(point)
      opener.t.side = 'before'

      console.log('mv:close', closer.t.end, -useDelims)
      point = move(clone(closer.t.end), -useDelims)
      closer.events.push([
        'exit',
        {type: type, start: point, end: closer.t.end}
      ])
      closer.t.end = clone(point)
      closer.t.side = 'after'

      // Remove items between opener and closer.
      opener.next = closer
      closer.previous = opener

      if (opener.size === 0) {
        remove(opener)
      }

      if (closer.size === 0) {
        after = closer.next
        remove(closer)
        closer = after
      }
    } else {
      closer = closer.next
    }

    if (!openerFound) {
      // Set lower bound for future searches for openers:
      openersBottom[oldCloser.t.size % 3][marker] = oldCloser.previous

      if (!oldCloser.t.canOpen) {
        // We can remove a closer that can't be an opener,
        // once we've seen there's no matching opener:
        remove(oldCloser)
      }
    }
  }

  // remove all delimiters
  while (last !== null && last !== stackBottom) {
    remove(last)
  }

  var length = events.length
  var index = 0
  var event
  var subevents
  var token

  while (index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.type === 'emphasisSequence') {
      subevents = token.events

      // If there is some or all of the token remaining:
      if (token.start.bufferIndex !== token.end.bufferIndex) {
        token.type = 'data'
        events[index + 1][1].type = 'data'

        subevents[token.side === 'before' ? 'unshift' : 'push'](
          event,
          events[index + 1]
        )
      }

      events.splice(index, 2, ...subevents)
      index += subevents.length
      length = length - 2 + subevents.length
    } else {
      index++
    }
  }

  return events

  function remove(item) {
    if (item.previous !== null) {
      item.previous.next = item.next
    }

    if (item.next === null) {
      last = item.previous
    } else {
      item.next.previous = item.previous
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
    if (code !== characters.asterisk && code !== characters.underscore)
      return nok(code)

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
      after !== 'whitespace' &&
      (after !== 'punctuation' ||
        before === 'whitespace' ||
        before === 'punctuation')
    rightFlanking =
      before !== 'whitespace' &&
      (before !== 'punctuation' ||
        after === 'whitespace' ||
        after === 'punctuation')

    if (marker === characters.asterisk) {
      canOpen = leftFlanking
      canClose = rightFlanking
    } else {
      canOpen = leftFlanking && (!rightFlanking || before === 'punctuation')
      canClose = rightFlanking && (!leftFlanking || after === 'punctuation')
    }

    token.canOpen = canOpen
    token.canClose = canClose
    token.size = size

    return ok(code)
  }
}

function classify(code) {
  if (code === characters.eof || unicodeWhitespace(code)) {
    return 'whitespace'
  }

  if (unicodePunctuation(code)) {
    return 'punctuation'
  }

  return null
}
