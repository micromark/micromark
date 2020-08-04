exports.tokenize = initializeFlow

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var subtokenize = require('../util/subtokenize')

var content = {tokenize: tokenizeContent, resolve: resolveContent}
var lookaheadConstruct = {tokenize: tokenizeLookaheadConstruct}

function initializeFlow(effects) {
  var initial = effects.createConstructsAttempt(
    this.parser.hooks.flowInitial,
    afterInitialConstruct,
    prefixStart
  )
  var prefixed = effects.createConstructsAttempt(
    this.parser.hooks.flow,
    afterConstruct,
    nonPrefixedConstruct
  )

  return initial

  function afterInitialConstruct(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    return initial(code)
  }

  function prefixStart(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      effects.consume(code)
      return prefixContinuation
    }

    return prefixed(code)
  }

  function prefixContinuation(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return prefixContinuation
    }

    effects.exit(types.linePrefix)
    return prefixed(code)
  }

  function nonPrefixedConstruct(code) {
    return code === codes.eof || markdownLineEnding(code)
      ? blankLine(code)
      : effects.createConstructAttempt(content, afterConstruct)(code)
  }

  function blankLine(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected a line ending or eof')
    effects.enter(types.lineEndingBlank)
    effects.consume(code)
    effects.exit(types.lineEndingBlank)
    return initial
  }

  function afterConstruct(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected a line ending or eof')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return initial
  }
}

// Content is transparent: it’s parsed right now. That way, definitions are also
// parsed right now: before inlines in paragraphs are parsed.
function resolveContent(events) {
  return subtokenize(events).events
}

function tokenizeContent(effects, ok) {
  return start

  function start(code) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected no line ending or EOF'
    )
    effects.enter(types.content).contentType = constants.contentTypeContent
    return data(code)
  }

  function data(code) {
    if (code === codes.eof) {
      effects.exit(types.content)
      return ok(code)
    }

    if (markdownLineEnding(code)) {
      return effects.isConstruct(
        lookaheadConstruct,
        constructAfterContent,
        noConstructAfterContent
      )(code)
    }

    // Data.
    effects.consume(code)
    return data
  }

  function constructAfterContent(code) {
    effects.exit(types.content)
    return ok(code)
  }

  function noConstructAfterContent(code) {
    assert(
      code !== codes.eof && markdownLineEnding(code),
      'expected a line ending'
    )
    effects.consume(code)
    return data
  }
}

// Note that `ok` is used to end the content block, and `nok` to instead
// continue.
function tokenizeLookaheadConstruct(effects, ok, nok) {
  var hooks = this.parser.hooks.flow
  var prefix = 0

  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected a line ending')
    effects.consume(code)
    return inPrefix
  }

  function inPrefix(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      prefix++
      return inPrefix
    }

    if (prefix < constants.tabSize) {
      // Blank line / other construct.
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : effects.isConstructs(hooks, ok, nok)(code)
    }

    return nok(code)
  }
}
