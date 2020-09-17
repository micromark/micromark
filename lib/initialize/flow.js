exports.tokenize = initializeFlow

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var constants = require('../constant/constants')
var types = require('../constant/types')
var subtokenize = require('../util/subtokenize')
var prefixSize = require('../util/prefix-size')
var createSpaceTokenizer = require('../tokenize/partial-space')
var blank = require('../tokenize/partial-blank-line')

var content = {
  tokenize: tokenizeContent,
  resolve: resolveContent,
  interruptible: true,
  lazy: true
}
var lookaheadConstruct = {tokenize: tokenizeLookaheadConstruct, partial: true}

function initializeFlow(effects) {
  var self = this
  var prefixed = effects.attempt(
    this.parser.constructs.flow,
    afterConstruct,
    effects.attempt(
      blank,
      atBlankEnding,
      effects.attempt(content, afterConstruct)
    )
  )
  var initial = effects.attempt(
    this.parser.constructs.flowInitial,
    afterConstruct,
    effects.attempt(createSpaceTokenizer(types.linePrefix), prefixed)
  )

  return initial

  function atBlankEnding(code) {
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

  function afterConstruct(code) {
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
function resolveContent(events) {
  return subtokenize(events).events
}

function tokenizeContent(effects, ok) {
  var previous

  return startContent

  function startContent(code) {
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

  function data(code) {
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

  function contentEnd(code) {
    effects.exit(types.chunkContent)
    effects.exit(types.content)
    return ok(code)
  }

  function contentContinue(code) {
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
function tokenizeLookaheadConstruct(effects, ok, nok) {
  var self = this

  return startLookahead

  function startLookahead(code) {
    assert(markdownLineEnding(code), 'expected a line ending')
    effects.exit(types.chunkContent)
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return effects.attempt(createSpaceTokenizer(types.linePrefix), prefixed)
  }

  function prefixed(code) {
    if (prefixSize(self.events) < constants.tabSize) {
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : effects.interrupt(self.parser.constructs.flow, ok, nok)(code)
    }

    return nok(code)
  }
}
