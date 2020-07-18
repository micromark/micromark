module.exports = content

var assert = require('assert')
var codes = require('../character/codes')
var definition = require('../tokenize/content/definition')
var paragraph = require('../tokenize/content/paragraph')
var setextHeading = require('../tokenize/content/setext-heading')

function content(effects) {
  var hooks = {}

  hooks[codes.leftSquareBracket] = definition

  var contentStart = effects.createConstructsAttempt(
    hooks,
    afterContentStartConstruct,
    potentialSetextHeading
  )

  return contentStart

  function afterContentStartConstruct(code) {
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
    assert(code === codes.eof, 'expected eof after paragraph')
    effects.consume(code)
    return afterParagraph
  }
}
