import type {Effects, NotOkay, Okay, Token, TokenizerThis} from '../types'
import * as assert from 'assert'
import * as codes from '../character/codes'
import markdownSpace from '../character/markdown-space'
import asciiDigit from '../character/ascii-digit'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import prefixSize from '../util/prefix-size'
import thematicBreak from './thematic-break'
import createSpaceTokenizer from './partial-space'
import * as blank from './partial-blank-line'

const listItemPrefixWhitespace = {
  tokenize: tokenizeListItemPrefixWhitespace,
  partial: true
}
const indent = {tokenize: tokenizeIndent, partial: true}
const nextItem = {tokenize: tokenizeNextItem, partial: true}

const listItemValueSizelimit = constants.listItemValueSizeMax - 1

export const tokenize = function tokenizeListStart(
  this: TokenizerThis,
  effects: Effects,
  ok: Okay,
  nok: NotOkay
) {
  var self = this
  var token: Token
  var initialSize: number

  return start

  function start(code: number) {
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

  function unordered(code: number) {
    if (!self.containerState.marker) {
      self.containerState.type = types.listUnordered
      effects.enter(self.containerState.type)
    }

    token = effects.enter(types.listItemPrefix)
    token._size = 0
    return atMarker(code)
  }

  function ordered(code: number) {
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

  function inside(code: number) {
    if (token._size < listItemValueSizelimit && asciiDigit(code)) {
      effects.consume(code)
      token._size++
      return inside
    }

    return afterValue(code)
  }

  function afterValue(code: number) {
    effects.exit(types.listItemValue)

    return code === codes.rightParenthesis || code === codes.dot
      ? atMarker(code)
      : nok(code)
  }

  function atMarker(code: number) {
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

  function onBlank(code: number) {
    // Can’t be empty when interrupting.
    if (self.interrupt) {
      return nok(code)
    }

    self.containerState.initialBlankLine = true
    initialSize++
    return endOfPrefix(code)
  }

  function otherPrefix(code: number) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)._size = 1
      effects.consume(code)
      effects.exit(types.listItemPrefixWhitespace)
      return endOfPrefix
    }

    return nok(code)
  }

  function endOfPrefix(code: number) {
    token._size += prefixSize(self.events, types.listItemPrefixWhitespace)
    self.containerState.size = initialSize + token._size
    effects.exit(types.listItemPrefix)
    return ok(code)
  }
}

function tokenizeNextItem(effects: Effects, ok: Okay, nok: NotOkay) {
  return effects.attempt(
    createSpaceTokenizer(types.linePrefix, constants.tabSize),
    effects.attempt(exports, ok, nok)
  )
}

function tokenizeListContinuation(this: TokenizerThis,effects: Effects, ok: Okay, nok: NotOkay) {
  var self = this

  this.containerState._closeFlow = undefined

  return effects.check(blank, onBlank, notBlank)

  function onBlank(code: number) {
    if (self.containerState.initialBlankLine) {
      self.containerState.furtherBlankLines = true
    }

    return ok(code)
  }

  function notBlank(code: number) {
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

  function onItem(code: number) {
    // While we do continue, we signal that the flow should be closed.
    self.containerState._closeFlow = true
    return ok(code)
  }
}

export const continuation = {tokenize: tokenizeListContinuation}

export const exit = function tokenizeListEnd(this: TokenizerThis, effects: Effects) {
  effects.exit(this.containerState.type)
}

function tokenizeIndent(this: TokenizerThis, effects: Effects, ok: Okay, nok: NotOkay) {
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemIndent, self.containerState.size + 1),
    afterPrefix
  )

  function afterPrefix(code: number) {
    return prefixSize(self.events, types.listItemIndent) ===
      self.containerState.size
      ? ok(code)
      : nok(code)
  }
}

function tokenizeListItemPrefixWhitespace(this: TokenizerThis, effects: Effects, ok: Okay, nok: NotOkay) {
  var self = this

  return effects.attempt(
    createSpaceTokenizer(types.listItemPrefixWhitespace, constants.tabSize + 1),
    afterPrefix
  )

  function afterPrefix(code: number) {
    return markdownSpace(code) ||
      !prefixSize(self.events, types.listItemPrefixWhitespace)
      ? nok(code)
      : ok(code)
  }
}
