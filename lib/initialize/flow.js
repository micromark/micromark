exports.tokenize = initializeFlow
exports.resolve = require('../util/initialize-resolver')

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')

var content = {resolve: resolveContent, tokenize: tokenizeContent}
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

  function afterConstruct(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected EOF or EOL')

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return initial
  }

  function blankLine(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected EOL')

    effects.enter(types.lineEndingBlank)
    effects.consume(code)
    effects.exit(types.lineEndingBlank)
    return initial
  }

  function nonPrefixedConstruct(code) {
    return effects.createConstructAttempt(
      content,
      afterConstruct,
      blankLine
    )(code)
  }
}

function resolveContent(events) {
  events[0][1].contentType = 'content'
  return events
}

function tokenizeContent(effects, ok, nok) {
  return start

  function start(code) {
    if (markdownEnding(code)) {
      return nok(code)
    }

    effects.enter(types.content)
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
    assert(markdownLineEnding(code), 'expected EOL')
    effects.consume(code)
    return data
  }
}

// Note that `ok` is used to end the content block, and `nok` to instead
// continue.
function tokenizeLookaheadConstruct(effects, ok, nok) {
  var hooks = this.parser.hooks.flow
  var prefix

  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected EOL')
    effects.consume(code)
    return afterEol
  }

  function afterEol(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      prefix = 1
      return inPrefix
    }

    return afterPrefix(code)
  }

  function inPrefix(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      prefix++
      return inPrefix
    }

    if (prefix < constants.tabSize) {
      return afterPrefix(code)
    }

    return nok(code)
  }

  function afterPrefix(code) {
    // Blank line / other construct.
    return markdownEnding(code)
      ? ok(code)
      : effects.isConstructs(hooks, ok, nok)(code)
  }
}
