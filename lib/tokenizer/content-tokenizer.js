'use strict'

module.exports = content

var assert = require('assert')
var characters = require('../util/characters')
var definition = require('../tokenize/flow/definition')
var paragraph = require('../tokenize/flow/paragraph')
var setextHeading = require('../tokenize/flow/setext-heading')

function content(effects) {
  var hooks = {}

  // To do: definitions.
  hooks[characters.leftSquareBracket] = definition

  var contentStart = effects.createConstructsAttempt(
    hooks,
    afterContentStartConstruct,
    potentialSetextHeading
  )

  return contentStart

  function afterContentStartConstruct(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return contentStart
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
    return contentStart
  }

  function potentialSetextHeading() {
    return effects.createConstructAttempt(
      setextHeading,
      afterContentStartConstruct,
      paragraphInitial
    )
  }

  function paragraphInitial() {
    return effects.createConstruct(paragraph, afterParagraph)
  }

  function afterParagraph(code) {
    assert(code === characters.eof, 'expected eof after paragraph')
    effects.consume(code)
    return afterParagraph
  }
}
