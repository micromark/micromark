import type {Event, Token} from '../types'
import * as codes from '../character/codes'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import shallow from '../util/shallow'
import classifyCharacter from '../util/classify-character'
import movePoint from '../util/move-point'

// Internal type for markers that could turn into emphasis or strong sequences.
var attentionSequence = 'attentionSequence'

// Take all events and resolve attention to emphasis or strong.
export default function resolveAllAttention(events: Event[], context: unknown) {
  var length = events.length
  var index = -1
  var token: Token
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
  var textToken
  var dataToken
  var marker

  // Create a double linked list from the sequences.
  while (++index < length) {
    token = events[index][1]

    if (token.type === attentionSequence && token._events) {
      previous = lastSequence
      lastSequence = {token: token, size: token._size, previous: previous}

      if (previous) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'next' does not exist on type '{ token: a... Remove this comment to see the full error message
        previous.next = lastSequence
      } else {
        // Head.
        closer = lastSequence
      }

      // Skip past exit.
      index++
    }
  }

  // Track openers of the different markers: `0` is used for both, `1` for
  // emphasis, and `2` for strong.
  openersBottom = {}
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  openersBottom[codes.asterisk] = []
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  openersBottom[codes.underscore] = []

  // From the first sequence, move forwards and find a closer.
  while (closer) {
    token = closer.token

    if (!token._close) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'next' does not exist on type '{ token: a... Remove this comment to see the full error message
      closer = closer.next
      continue
    }

    // When we have a closer, move backwards for an opener.
    marker = token._marker

    opener = closer.previous
    openerFound = undefined

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
      sequenceToken = {
        type: use > 1 ? types.strongSequence : types.emphasisSequence,
        start: movePoint(shallow(openerToken.end), -use),
        end: shallow(openerToken.end)
      }
      textToken = {
        type: use > 1 ? types.strongText : types.emphasisText,
        start: shallow(openerToken.end),
        end: shallow(token.start)
      }
      attentionToken = {
        type: use > 1 ? types.strong : types.emphasis,
        start: shallow(sequenceToken.start)
      }
      openerToken._events.unshift(
        ['enter', attentionToken, context],
        ['enter', sequenceToken, context],
        ['exit', sequenceToken, context],
        ['enter', textToken, context]
      )
      openerToken.end = shallow(sequenceToken.start)
      openerToken._side = constants.attentionSideBefore

      sequenceToken = {
        type: sequenceToken.type,
        start: token.start,
        end: movePoint(shallow(token.start), use)
      }
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'end' does not exist on type '{ type: any... Remove this comment to see the full error message
      attentionToken.end = shallow(sequenceToken.end)
      token._events.push(
        ['exit', textToken, context],
        ['enter', sequenceToken, context],
        ['exit', sequenceToken, context],
        ['exit', attentionToken, context]
      )
      token.start = shallow(sequenceToken.end)
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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
    token = events[index][1]

    if (token.type === attentionSequence && token._events) {
      subevents = token._events

      // If there is some or all of the token remaining:
      if (token.start.offset !== token.end.offset) {
        // To do: check position, because `token.end` might have a negative
        // `_bufferIndex`
        // It might be better to have separate tokens per character, and change
        // their types instead.
        dataToken = {type: types.data, start: token.start, end: token.end}
        subevents[
          token._side === constants.attentionSideBefore ? 'unshift' : 'push'
        ](['enter', dataToken, context], ['exit', dataToken, context])
      }

      token._subevents = subevents
      token._events = undefined

      // Skip past exit.
      index++
    }
  }

  return events

  function unlink(sequence: any) {
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

export function tokenizeAttention(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var before = classifyCharacter(this.previous)
  var size = 0
  var marker: any

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.asterisk && code !== codes.underscore) {
      return nok(code)
    }

    effects.enter(attentionSequence)
    marker = code
    return more(code)
  }

  function more(code: any) {
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

    token = effects.exit(attentionSequence)
    after = classifyCharacter(code)
    open = !after || (before && after === constants.characterGroupPunctuation)
    close = !before || (after && before === constants.characterGroupPunctuation)

    if (marker === codes.underscore) {
      originalOpen = open
      open = open && (before || !close)
      close = close && (after || !originalOpen)
    }

    token._events = []
    token._marker = marker
    token._open = open
    token._close = close
    token._size = size

    return ok(code)
  }
}
