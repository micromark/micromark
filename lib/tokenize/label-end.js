/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Resolve} Resolve
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').Event} Event
 * @typedef {import('../types.js').Token} Token
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Code} Code
 */

import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEndingOrSpace} from '../character/markdown-line-ending-or-space.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {chunkedPush} from '../util/chunked-push.js'
import {chunkedSplice} from '../util/chunked-splice.js'
import {normalizeIdentifier} from '../util/normalize-identifier.js'
import {resolveAll} from '../util/resolve-all.js'
import {shallow} from '../util/shallow.js'
import {factoryDestination} from './factory-destination.js'
import {factoryLabel} from './factory-label.js'
import {factoryTitle} from './factory-title.js'
import {factoryWhitespace} from './factory-whitespace.js'

/** @type {Construct} */
export const labelEnd = {
  name: 'labelEnd',
  tokenize: tokenizeLabelEnd,
  resolveTo: resolveToLabelEnd,
  resolveAll: resolveAllLabelEnd
}

/** @type {Construct} */
const resourceConstruct = {tokenize: tokenizeResource}
/** @type {Construct} */
const fullReferenceConstruct = {tokenize: tokenizeFullReference}
/** @type {Construct} */
const collapsedReferenceConstruct = {tokenize: tokenizeCollapsedReference}

/** @type {Resolve} */
function resolveAllLabelEnd(events) {
  let index = -1
  /** @type {Token} */
  let token

  while (++index < events.length) {
    token = events[index][1]

    if (
      token.type === types.labelImage ||
      token.type === types.labelLink ||
      token.type === types.labelEnd
    ) {
      // Remove the marker.
      events.splice(index + 1, token.type === types.labelImage ? 4 : 2)
      token.type = types.data
      index++
    }
  }

  return events
}

/** @type {Resolve} */
function resolveToLabelEnd(events, context) {
  let index = events.length
  let offset = 0
  /** @type {Token} */
  let token
  /** @type {number} */
  let open
  /** @type {number} */
  let close
  /** @type {Event[]} */
  let media

  // Find an opening.
  while (index--) {
    token = events[index][1]

    if (open) {
      // If we see another link, or inactive link label, we’ve been here before.
      if (
        token.type === types.link ||
        (token.type === types.labelLink && token._inactive)
      ) {
        break
      }

      // Mark other link openings as inactive, as we can’t have links in
      // links.
      if (events[index][0] === 'enter' && token.type === types.labelLink) {
        token._inactive = true
      }
    } else if (close) {
      if (
        events[index][0] === 'enter' &&
        (token.type === types.labelImage || token.type === types.labelLink) &&
        !token._balanced
      ) {
        open = index

        if (token.type !== types.labelLink) {
          offset = 2
          break
        }
      }
    } else if (token.type === types.labelEnd) {
      close = index
    }
  }

  const group = {
    type: events[open][1].type === types.labelLink ? types.link : types.image,
    start: shallow(events[open][1].start),
    end: shallow(events[events.length - 1][1].end)
  }

  const label = {
    type: types.label,
    start: shallow(events[open][1].start),
    end: shallow(events[close][1].end)
  }

  const text = {
    type: types.labelText,
    start: shallow(events[open + offset + 2][1].end),
    end: shallow(events[close - 2][1].start)
  }

  media = [
    ['enter', group, context],
    ['enter', label, context]
  ]

  // Opening marker.
  media = chunkedPush(media, events.slice(open + 1, open + offset + 3))

  // Text open.
  media = chunkedPush(media, [['enter', text, context]])

  // Between.
  media = chunkedPush(
    media,
    resolveAll(
      context.parser.constructs.insideSpan.null,
      events.slice(open + offset + 4, close - 3),
      context
    )
  )

  // Text close, marker close, label close.
  media = chunkedPush(media, [
    ['exit', text, context],
    events[close - 2],
    events[close - 1],
    ['exit', label, context]
  ])

  // Reference, resource, or so.
  media = chunkedPush(media, events.slice(close + 1))

  // Media close.
  media = chunkedPush(media, [['exit', group, context]])

  chunkedSplice(events, open, events.length, media)

  return events
}

/** @type {Tokenize} */
function tokenizeLabelEnd(effects, ok, nok) {
  const self = this
  let index = self.events.length
  /** @type {Token} */
  let labelStart
  /** @type {boolean} */
  let defined

  // Find an opening.
  while (index--) {
    if (
      (self.events[index][1].type === types.labelImage ||
        self.events[index][1].type === types.labelLink) &&
      !self.events[index][1]._balanced
    ) {
      labelStart = self.events[index][1]
      break
    }
  }

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.rightSquareBracket, 'expected `]`')

    if (!labelStart) {
      return nok(code)
    }

    // It’s a balanced bracket, but contains a link.
    if (labelStart._inactive) return balanced(code)
    defined = self.parser.defined.includes(
      normalizeIdentifier(
        self.sliceSerialize({start: labelStart.end, end: self.now()})
      )
    )
    effects.enter(types.labelEnd)
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelEnd)
    return afterLabelEnd
  }

  /** @type {State} */
  function afterLabelEnd(code) {
    // Resource: `[asd](fgh)`.
    if (code === codes.leftParenthesis) {
      return effects.attempt(
        resourceConstruct,
        ok,
        defined ? ok : balanced
      )(code)
    }

    // Collapsed (`[asd][]`) or full (`[asd][fgh]`) reference?
    if (code === codes.leftSquareBracket) {
      return effects.attempt(
        fullReferenceConstruct,
        ok,
        defined
          ? effects.attempt(collapsedReferenceConstruct, ok, balanced)
          : balanced
      )(code)
    }

    // Shortcut reference: `[asd]`?
    return defined ? ok(code) : balanced(code)
  }

  /** @type {State} */
  function balanced(code) {
    labelStart._balanced = true
    return nok(code)
  }
}

/** @type {Tokenize} */
function tokenizeResource(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    assert.strictEqual(code, codes.leftParenthesis, 'expected left paren')
    effects.enter(types.resource)
    effects.enter(types.resourceMarker)
    effects.consume(code)
    effects.exit(types.resourceMarker)
    return factoryWhitespace(effects, open)
  }

  /** @type {State} */
  function open(code) {
    if (code === codes.rightParenthesis) {
      return end(code)
    }

    return factoryDestination(
      effects,
      destinationAfter,
      nok,
      types.resourceDestination,
      types.resourceDestinationLiteral,
      types.resourceDestinationLiteralMarker,
      types.resourceDestinationRaw,
      types.resourceDestinationString,
      constants.linkResourceDestinationBalanceMax
    )(code)
  }

  /** @type {State} */
  function destinationAfter(code) {
    return markdownLineEndingOrSpace(code)
      ? factoryWhitespace(effects, between)(code)
      : end(code)
  }

  /** @type {State} */
  function between(code) {
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      return factoryTitle(
        effects,
        factoryWhitespace(effects, end),
        nok,
        types.resourceTitle,
        types.resourceTitleMarker,
        types.resourceTitleString
      )(code)
    }

    return end(code)
  }

  /** @type {State} */
  function end(code) {
    if (code === codes.rightParenthesis) {
      effects.enter(types.resourceMarker)
      effects.consume(code)
      effects.exit(types.resourceMarker)
      effects.exit(types.resource)
      return ok
    }

    return nok(code)
  }
}

/** @type {Tokenize} */
function tokenizeFullReference(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    assert.strictEqual(code, codes.leftSquareBracket, 'expected left bracket')
    return factoryLabel.call(
      self,
      effects,
      afterLabel,
      nok,
      types.reference,
      types.referenceMarker,
      types.referenceString
    )(code)
  }

  /** @type {State} */
  function afterLabel(code) {
    return self.parser.defined.includes(
      normalizeIdentifier(
        self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1)
      )
    )
      ? ok(code)
      : nok(code)
  }
}

/** @type {Tokenize} */
function tokenizeCollapsedReference(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    assert.strictEqual(code, codes.leftSquareBracket, 'expected left bracket')
    effects.enter(types.reference)
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    return open
  }

  /** @type {State} */
  function open(code) {
    if (code === codes.rightSquareBracket) {
      effects.enter(types.referenceMarker)
      effects.consume(code)
      effects.exit(types.referenceMarker)
      effects.exit(types.reference)
      return ok
    }

    return nok(code)
  }
}
