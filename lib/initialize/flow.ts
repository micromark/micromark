import type { Effects, Okay, NotOkay, Event, Parser, Token } from '../types'
import * as assert from 'assert'
import * as codes from '../character/codes'.
import markdownLineEnding from '../character/markdown-line-ending'
import * as constants from '../constant/constants'
import * as types from '../constant/types'
import subtokenize from '../util/subtokenize'
import prefixSize from '../util/prefix-size'
import createSpaceTokenizer from '../tokenize/partial-space'
import blank from '../tokenize/partial-blank-line'

var content = {
  tokenize: tokenizeContent,
  resolve: resolveContent,
  name: 'content'
}
var lookaheadConstruct = {tokenize: tokenizeLookaheadConstruct, partial: true}

export default function initializeFlow(effects: Effects) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this
  var prefixed = effects.attempt(
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    this.parser.hooks.flow,
    afterConstruct,
    effects.attempt(
      blank,
      atBlankEnding,
      effects.attempt(content, afterConstruct)
    )
  )
  var initial = effects.attempt(
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    this.parser.hooks.flowInitial,
    afterConstruct,
    effects.attempt(createSpaceTokenizer(types.linePrefix), prefixed)
  )

  return initial

  function atBlankEnding(code: number) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected eol or eof')
    effects.enter(types.lineEndingBlank)
    effects.consume(code)
    effects.exit(types.lineEndingBlank)
    self.currentConstruct = undefined
    return initial
  }

  function afterConstruct(code: number) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected eol or eof')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    self.currentConstruct = undefined
    return initial
  }
}

// Content is transparent: it’s parsed right now. That way, definitions are also
// parsed right now: before inlines in paragraphs are parsed.
function resolveContent(events: Event[]) {
  return subtokenize(events).events
}

function tokenizeContent(effects: Effects, ok: Okay) {
  var previous: Token

  return startContent

  function startContent(code: number) {
    var token

    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected no eof or eol'
    )

    effects.enter(types.content)
    token = effects.enter(types.chunkContent)
    token.contentType = constants.contentTypeContent
    previous = token

    return data(code)
  }

  function data(code: number) {
    if (code === codes.eof) {
      return contentEnd(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(
        lookaheadConstruct,
        contentEnd,
        contentContinue
      )(code)
    }

    // Data.
    effects.consume(code)
    return data
  }

  function contentEnd(code: number) {
    effects.exit(types.chunkContent)
    effects.exit(types.content)
    return ok(code)
  }

  function contentContinue(code: number) {
    var token

    assert(markdownLineEnding(code), 'expected eol')
    effects.consume(code)
    effects.exit(types.chunkContent)._break = true
    token = effects.enter(types.chunkContent)
    token.contentType = constants.contentTypeContent
    token.previous = previous
    previous.next = token
    previous = token
    return data
  }
}

// Note that `ok` is used to end the content block, and `nok` to instead
// continue.
function tokenizeLookaheadConstruct(this: {events: Event[], parser: Parser}, effects: Effects, ok: Okay, nok: NotOkay) {
  var self = this

  return startLookahead

  function startLookahead(code: number) {
    assert(markdownLineEnding(code), 'expected a line ending')
    effects.exit(types.chunkContent)
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(createSpaceTokenizer(types.linePrefix), prefixed)
  }

  function prefixed(code: number) {
    if (prefixSize(self.events) < constants.tabSize) {
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : effects.interrupt(self.parser.hooks.flow, ok, nok)(code)
    }

    return nok(code)
  }
}
