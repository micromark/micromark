module.exports = content

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')
var paragraph = require('../tokenize/paragraph')
var setextHeading = require('../tokenize/setext-heading')

function content(effects) {
  var contentStart = effects.createConstructsAttempt(
    this.parser.hooks.contentInitial,
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

    assert(markdownLineEnding(code), 'expected EOF or EOL')

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
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
    return effects.createConstructAttempt(paragraph, afterParagraph)
  }

  function afterParagraph(code) {
    assert.equal(code, codes.eof, 'expected EOF')
    effects.consume(code)
    return afterParagraph
  }
}
