exports.tokenize = initializeContent

var assert = require('assert')
var codes = require('../character/codes')
var markdownEnding = require('../character/markdown-ending')
var constants = require('../constant/constants')
var types = require('../constant/types')

function initializeContent(effects) {
  var contentStart = effects.createConstructsAttempt(
    this.parser.hooks.contentInitial,
    afterContentStartConstruct,
    paragraphInitial
  )

  return contentStart

  function afterContentStartConstruct(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    assert(markdownEnding(code), 'expected a line ending EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return contentStart
  }

  function paragraphInitial(code) {
    effects.enter(types.paragraph).contentType = constants.contentTypeText
    assert(
      !markdownEnding(code),
      'expected anything other than a line ending or EOF'
    )
    return data(code)
  }

  function data(code) {
    if (code === codes.eof) {
      effects.exit(types.paragraph)
      effects.consume(code)
      return
    }

    // Data.
    effects.consume(code)
    return data
  }
}
