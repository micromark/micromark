'use strict'

module.exports = flow

var assert = require('assert')
var codes = require('../character/codes')
var constants = require('../constant/constants')
var atxHeading = require('../tokenize/flow/atx-heading')
var fencedCode = require('../tokenize/flow/fenced-code')
var html = require('../tokenize/flow/html')
var indentedCode = require('../tokenize/flow/indented-code')
var thematicBreak = require('../tokenize/flow/thematic-break')
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
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefixContinuation
    }

    return prefixed(code)
  }

  function prefixContinuation(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
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

    assert(
      code === codes.cr || code === codes.lf || code === codes.crlf,
      'expected an EOF or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return initial
  }

  function blankLine(code) {
    assert(
      code === codes.cr || code === codes.lf || code === codes.crlf,
      'expected an EOL for this state'
    )

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
      if (
        code === codes.eof ||
        code === codes.cr ||
        code === codes.lf ||
        code === codes.crlf
      ) {
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

      if (code === codes.cr || code === codes.lf || code === codes.crlf) {
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
      assert(
        code === codes.cr || code === codes.lf || code === codes.crlf,
        'expected an EOL for this state'
      )

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
      assert(
        code === codes.cr || code === codes.lf || code === codes.crlf,
        'expected an EOL for this state'
      )

      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return afterEol
    }

    function afterEol(code) {
      if (code === codes.ht || code === codes.vs || code === codes.space) {
        effects.enter('linePrefix')
        effects.consume(code)
        prefix = 1
        return inPrefix
      }

      return afterPrefix(code)
    }

    function inPrefix(code) {
      if (code === codes.ht || code === codes.vs || code === codes.space) {
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
      if (
        code === codes.eof ||
        code === codes.cr ||
        code === codes.lf ||
        code === codes.crlf
      ) {
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
    var content = events[0][1]
    var tokenizer = core.content(content.start)
    return events[0][2].sliceStream(content).concat(null).flatMap(tokenizer)
  }
}
