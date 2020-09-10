exports.tokenize = initializeFlow

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'markdownLineEnding'.
import markdownLineEnding from '../character/markdown-line-ending'
import constants from '../constant/constants'
import types from '../constant/types'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'subtokenize'.
import subtokenize from '../util/subtokenize'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'prefixSize'.
import prefixSize from '../util/prefix-size'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'createSpaceTokenizer'.
import createSpaceTokenizer from '../tokenize/partial-space'
import blank from '../tokenize/partial-blank-line'

var content = {
  tokenize: tokenizeContent,
  resolve: resolveContent,
  name: 'content'
}
var lookaheadConstruct = {tokenize: tokenizeLookaheadConstruct, partial: true}

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'initializeFlow'.
function initializeFlow(effects: any) {
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

  function atBlankEnding(code: any) {
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

  function afterConstruct(code: any) {
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
function resolveContent(events: any) {
  return subtokenize(events).events
}

function tokenizeContent(effects: any, ok: any) {
  var previous: any

  return startContent

  function startContent(code: any) {
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

  function data(code: any) {
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

  function contentEnd(code: any) {
    effects.exit(types.chunkContent)
    effects.exit(types.content)
    return ok(code)
  }

  function contentContinue(code: any) {
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
function tokenizeLookaheadConstruct(effects: any, ok: any, nok: any) {
  // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
  var self = this

  return startLookahead

  function startLookahead(code: any) {
    assert(markdownLineEnding(code), 'expected a line ending')
    effects.exit(types.chunkContent)
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(createSpaceTokenizer(types.linePrefix), prefixed)
  }

  function prefixed(code: any) {
    if (prefixSize(self.events) < constants.tabSize) {
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : effects.interrupt(self.parser.hooks.flow, ok, nok)(code)
    }

    return nok(code)
  }
}
