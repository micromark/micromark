'use strict'

module.exports = text

var characters = require('../util/characters')
var autolink = require('../tokenize/text/autolink')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')
var code = require('../tokenize/text/code')
var emphasis = require('../tokenize/text/emphasis')
var hardBreakEscape = require('../tokenize/text/hard-break-escape')
var hardBreakTrailing = require('../tokenize/text/hard-break-trailing')
var html = require('../tokenize/text/html')
var labelStartImage = require('../tokenize/text/label-start-image')
var labelStartLink = require('../tokenize/text/label-start-link')
var labelEnd = require('../tokenize/text/label-end')
var labelResource = require('../tokenize/text/label-resource')

var own = {}.hasOwnProperty

function text(effects) {
  var hooks = {}

  hooks[characters.space] = hardBreakTrailing // This one should be caught in block.
  hooks[characters.exclamationMark] = labelStartImage
  hooks[characters.ampersand] = characterReference
  hooks[characters.leftParenthesis] = labelResource
  hooks[characters.asterisk] = emphasis
  hooks[characters.lessThan] = [autolink, html]
  hooks[characters.leftSquareBracket] = labelStartLink
  hooks[characters.backslash] = [hardBreakEscape, characterEscape]
  hooks[characters.rightSquareBracket] = labelEnd
  hooks[characters.underscore] = emphasis
  hooks[characters.graveAccent] = code

  var text = effects.createHookableState(hooks, after, dataStart)

  return text

  function after(code) {
    // Make sure we eat EOFs.
    if (code !== code) {
      effects.consume(code)
      return after
    }

    // Otherwise, try the hooks again.
    return text(code)
  }

  function dataStart(code) {
    effects.enter('data')
    effects.consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code !== code) {
      effects.exit('data')
      return text
    }

    // Data.
    effects.consume(code)
    return data
  }
}
