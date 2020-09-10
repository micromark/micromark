exports.tokenize = tokenizeListStart
exports.continuation = {tokenize: tokenizeListContinuation}
exports.exit = tokenizeListEnd

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownSpace'.
import markdownSpace from '../character/markdown-space'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiDigit'.
import asciiDigit from '../character/ascii-digit'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'prefixSize'.
import prefixSize from '../util/prefix-size'
import thematicBreak from './thematic-break'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from './partial-space'
import blank from './partial-blank-line'

var listItemPrefixWhitespace = {
  tokenize: tokenizeListItemPrefixWhitespace,
  partial: true
}
var indent = {tokenize: tokenizeIndent, partial: true}
var nextItem = {tokenize: tokenizeNextItem, partial: true}

var listItemValueSizelimit = constants.listItemValueSizeMax - 1

function tokenizeListStart(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var token: any
  var initialSize: any

  return start

  function start(code: any) {
    initialSize = prefixSize(self.events)

    if (
      code === self.containerState.marker ||
      (!self.containerState.marker &&
        (code === codes.asterisk ||
          code === codes.plusSign ||
          code === codes.dash))
    ) {
      return effects.check(thematicBreak, nok, unordered)(code)
    }

    if (
      asciiDigit(code) &&
      (!self.containerState.marker ||
        self.containerState.type === types.listOrdered)
    ) {
      return ordered(code)
    }

    return nok(code)
  }

  function unordered(code: any) {
    if (!self.containerState.marker) {
      self.containerState.type = types.listUnordered
      effects.enter(self.containerState.type)
    }

    token = effects.enter(types.listItemPrefix)
    token._size = 0
    return atMarker(code)
  }

  function ordered(code: any) {
    if (
      !self.containerState.marker &&
      self.interrupt &&
      code !== codes.digit1
    ) {
      return nok(code)
    }

    if (!self.containerState.marker) {
      self.containerState.type = types.listOrdered
      effects.enter(self.containerState.type)
    }

    token = effects.enter(types.listItemPrefix)
    effects.enter(types.listItemValue)
    effects.consume(code)
    token._size = 1
    return self.interrupt ? afterValue : inside
  }

  function inside(code: any) {
    if (token._size < listItemValueSizelimit && asciiDigit(code)) {
      effects.consume(code)
      token._size++
      return inside
    }

    return afterValue(code)
  }

  function afterValue(code: any) {
    effects.exit(types.listItemValue)

    return code === codes.rightParenthesis || code === codes.dot
      ? atMarker(code)
      : nok(code)
  }

  function atMarker(code: any) {
    assert(
      code === codes.asterisk ||
        code === codes.plusSign ||
        code === codes.dash ||
        code === codes.rightParenthesis ||
        code === codes.dot,
      'expected list marker'
    )

    if (!self.containerState.marker) self.containerState.marker = code

    if (self.containerState.marker === code) {
      effects.enter(types.listItemMarker)
      effects.consume(code)
      effects.exit(types.listItemMarker)
      token._size++
      return effects.check(
        blank,
        onBlank,
        effects.attempt(listItemPrefixWhitespace, endOfPrefix, otherPrefix)
      )
    }

    return nok(code)
  }

  function onBlank(code: any) {
    // Can’t be empty when interrupting.
    if (self.interrupt) {
      return nok(code)
    }

    self.containerState.initialBlankLine = true
    initialSize++
    return endOfPrefix(code)
  }

  function otherPrefix(code: any) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)._size = 1
      effects.consume(code)
      effects.exit(types.listItemPrefixWhitespace)
      return endOfPrefix
    }

    return nok(code)
  }

  function endOfPrefix(code: any) {
    token._size += prefixSize(self.events, types.listItemPrefixWhitespace)
    self.containerState.size = initialSize + token._size
    effects.exit(types.listItemPrefix)
    return ok(code)
  }
}

function tokenizeNextItem(effects: any, ok: any, nok: any) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

function tokenizeListContinuation(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  this.containerState._closeFlow = undefined

  return effects.check(blank, onBlank, notBlank)

  function onBlank(code: any) {
    if (self.containerState.initialBlankLine) {
      self.containerState.furtherBlankLines = true
    }

    return ok(code)
  }

  function notBlank(code: any) {
    if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
      self.containerState.initialBlankLine = undefined
      self.containerState.furtherBlankLines = undefined
      return effects.attempt(nextItem, onItem, nok)(code)
    }

    self.containerState.initialBlankLine = undefined
    self.containerState.furtherBlankLines = undefined
    return effects.attempt(
      indent,
      ok,
      effects.attempt(nextItem, onItem, nok)
    )(code)
  }

  function onItem(code: any) {
    // While we do continue, we signal that the flow should be closed.
    self.containerState._closeFlow = true
    return ok(code)
  }
}

function tokenizeListEnd(effects: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  effects.exit(this.containerState.type)
}

function tokenizeIndent(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemIndent, self.containerState.size + 1),
    afterPrefix
  )

  function afterPrefix(code: any) {
    return prefixSize(self.events, types.listItemIndent) ===
      self.containerState.size
      ? ok(code)
      : nok(code)
  }
}

function tokenizeListItemPrefixWhitespace(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemPrefixWhitespace, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code: any) {
    return markdownSpace(code) ||
      !prefixSize(self.events, types.listItemPrefixWhitespace)
      ? nok(code)
      : ok(code)
  }
}
