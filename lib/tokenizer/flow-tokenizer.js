'use strict'

module.exports = flow

var assert = require('assert')
var characters = require('../util/characters')
var atxHeading = require('../tokenize/flow/atx-heading')
var fencedCode = require('../tokenize/flow/fenced-code')
var html = require('../tokenize/flow/html')
var indentedCode = require('../tokenize/flow/indented-code')
var thematicBreak = require('../tokenize/flow/thematic-break')
var core = require('../core')

var tabSize = 4

function flow(effects) {
  var initialFlowHooks = {}
  var flowHooks = {}

  initialFlowHooks[characters.ht] = indentedCode
  initialFlowHooks[characters.space] = indentedCode

  flowHooks[characters.numberSign] = atxHeading
  flowHooks[characters.asterisk] = thematicBreak
  flowHooks[characters.dash] = thematicBreak
  flowHooks[characters.lessThan] = html
  flowHooks[characters.underscore] = thematicBreak
  flowHooks[characters.graveAccent] = fencedCode
  flowHooks[characters.tilde] = fencedCode

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
    if (code === characters.eof) {
      effects.consume(code)
      return afterInitialConstruct
    }

    return initial(code)
  }

  function prefixStart(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefixContinuation
    }

    return prefixed(code)
  }

  function prefixContinuation(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return prefixContinuation
    }

    effects.exit('linePrefix')
    return prefixed(code)
  }

  function afterConstruct(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return afterConstruct
    }

    assert(
      code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf,
      'expected an EOF or EOL for this state'
    )

    effects.enter('lineFeed')
    effects.consume(code)
    effects.exit('lineFeed')
    return initial
  }

  function nonPrefixedConstruct() {
    return effects.createConstruct(content, afterConstruct)
  }

  function tokenizeContent(effects, ok) {
    return start

    function start(code) {
      if (
        code === characters.eof ||
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf
      ) {
        return ok(code)
      }

      effects.enter('paragraph')
      return data(code)
    }

    function data(code) {
      if (code === characters.eof) {
        effects.exit('paragraph')
        return ok(code)
      }

      if (
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf
      ) {
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
      effects.exit('paragraph')
      return ok(code)
    }

    function noConstructAfterContent(code) {
      assert(
        code === characters.cr ||
          code === characters.lf ||
          code === characters.crlf,
        'expected an EOF or EOL for this state'
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
        code === characters.cr ||
          code === characters.lf ||
          code === characters.crlf,
        'expected an EOL for this state'
      )

      effects.enter('lineFeed')
      effects.consume(code)
      effects.exit('lineFeed')
      return afterEol
    }

    function afterEol(code) {
      if (
        code === characters.ht ||
        code === characters.vs ||
        code === characters.space
      ) {
        effects.enter('linePrefix')
        effects.consume(code)
        prefix = 1
        return inPrefix
      }

      return afterPrefix(code)
    }

    function inPrefix(code) {
      if (
        code === characters.ht ||
        code === characters.vs ||
        code === characters.space
      ) {
        effects.consume(code)
        prefix++
        return inPrefix
      }

      if (prefix >= tabSize) {
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
        code === characters.eof ||
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf
      ) {
        return ok(code)
      }

      return effects.isConstruct(atxHeading, ok, notHeading)
    }

    function notHeading() {
      return effects.isConstruct(thematicBreak, ok, notThematicBreak)
    }

    function notThematicBreak() {
      return effects.isConstruct(html, ok, notHtml)
    }

    function notHtml() {
      return effects.isConstruct(fencedCode, ok, nok)
    }
  }

  function resolveContent(events) {
    // Empty (a blank line)
    if (events.length === 0) {
      return events
    }

    var content = events[0][1]
    var tokenizer = core.text(content.start)
    var d = events[0][2].sliceStream(content).concat(null)
    var b = d.flatMap(tokenizer)

    return [].concat(events.slice(0, 1), b, events.slice(-1))
  }
}
