module.exports = flow

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var atxHeading = require('../tokenize/flow/atx-heading')
var fencedCode = require('../tokenize/flow/fenced-code')
var html = require('../tokenize/flow/html')
var indentedCode = require('../tokenize/flow/indented-code')
var thematicBreak = require('../tokenize/flow/thematic-break')
var tokenizeEvent = require('../util/tokenize-event')
var core = require('../core')

function flow(effects) {
  var initialFlowHooks = {}
  var flowHooks = {}

  initialFlowHooks[codes.ht] = indentedCode
  initialFlowHooks[codes.space] = indentedCode

  flowHooks[codes.numberSign] = atxHeading
  flowHooks[codes.asterisk] = thematicBreak
  flowHooks[codes.dash] = thematicBreak
  flowHooks[codes.lessThan] = html
  flowHooks[codes.underscore] = thematicBreak
  flowHooks[codes.graveAccent] = fencedCode
  flowHooks[codes.tilde] = fencedCode

  var content = {tokenize: tokenizeContent, resolve: resolveContent}
  var lookaheadConstruct = {tokenize: tokenizeLookaheadConstruct}
  var initial = effects.createConstructsAttempt(
    initialFlowHooks,
    afterInitialConstruct,
    prefixStart
  )
  var prefixed = effects.createConstructsAttempt(
    flowHooks,
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
      effects.enter('linePrefix')
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

    effects.exit('linePrefix')
    return prefixed(code)
  }

  function afterConstruct(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownLineEnding(code), 'expected an EOF or EOL for this state')

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return initial
  }

  function blankLine(code) {
    assert(markdownLineEnding(code), 'expected an EOL for this state')

    var token = effects.enter('lineEnding')
    token.blankEnding = true
    effects.consume(code)
    effects.exit('lineEnding')
    return initial
  }

  function nonPrefixedConstruct() {
    return effects.createConstructAttempt(content, afterConstruct, blankLine)
  }

  function tokenizeContent(effects, ok, nok) {
    return start

    function start(code) {
      if (markdownEnding(code)) {
        return nok(code)
      }

      effects.enter('content')
      return data(code)
    }

    function data(code) {
      if (code === codes.eof) {
        effects.exit('content')
        return ok(code)
      }

      if (markdownLineEnding(code)) {
        return effects.isConstruct(
          lookaheadConstruct,
          constructAfterContent,
          noConstructAfterContent
        )
      }

      // Data.
      effects.consume(code)
      return data
    }

    function constructAfterContent(code) {
      effects.exit('content')
      return ok(code)
    }

    function noConstructAfterContent(code) {
      assert(markdownLineEnding(code), 'expected an EOL for this state')

      // To do:
      // - [ ] `lineFeed`, `lineData`.
      effects.consume(code)
      return data
    }
  }

  // To do:
  // - [ ] Maybe lookahead isn’t such a great idea?
  // - [ ] Do not track tokens.
  function tokenizeLookaheadConstruct(effects, ok, nok) {
    // Note that `ok` is used to end the content block, and `nok` to instead
    // continue.
    var prefix

    return start

    function start(code) {
      assert(markdownLineEnding(code), 'expected an EOL for this state')

      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return afterEol
    }

    function afterEol(code) {
      if (markdownSpace(code)) {
        effects.enter('linePrefix')
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

      if (prefix >= constants.tabSize) {
        return nok(code)
      }

      effects.exit('linePrefix')
      return afterPrefix(code)
    }

    // To do:
    // - [ ] Make different constructs pretty.
    function afterPrefix(code) {
      // Blank line:
      if (markdownEnding(code)) {
        return ok(code)
      }

      return effects.isConstruct(atxHeading, ok, maybeThematicBreak)
    }

    function maybeThematicBreak() {
      return effects.isConstruct(thematicBreak, ok, maybeHtml)
    }

    function maybeHtml() {
      return effects.isConstruct(html, ok, maybeFencedCode)
    }

    function maybeFencedCode() {
      return effects.isConstruct(fencedCode, ok, nok)
    }
  }

  function resolveContent(events) {
    return tokenizeEvent(events[0], core.content)
  }
}
