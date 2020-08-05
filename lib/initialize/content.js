exports.tokenize = initializeContent

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var constants = require('../constant/constants')
var types = require('../constant/types')

function initializeContent(effects) {
  var contentStart = effects.attempts(
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

    assert(markdownLineEnding(code), 'expected a line ending EOF')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return contentStart
  }

  function paragraphInitial(code) {
    assert(
      code !== codes.eof && !markdownLineEnding(code),
      'expected anything other than a line ending or EOF'
    )
    effects.enter(types.paragraph).contentType = constants.contentTypeText
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
