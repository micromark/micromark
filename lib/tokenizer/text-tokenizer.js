'use strict'

module.exports = text

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

var space = 32 // ' '
var exclamationMark = 33 // '!'
var ampersand = 38 // '&'
var leftParenthesis = 40 // '('
var asterisk = 42 // '*'
var lessThan = 60 // '<'
var leftSquareBracket = 91 // '['
var backslash = 92 // '\'
var rightSquareBracket = 93 // ']'
var underscore = 95 // '_'
var graveAccent = 96 // '`'

var own = {}.hasOwnProperty

function text(effects) {
  var hooks = {}

  hooks[space] = hardBreakTrailing // This one should be caught in block.
  hooks[exclamationMark] = labelStartImage
  hooks[ampersand] = characterReference
  hooks[leftParenthesis] = labelResource
  hooks[asterisk] = emphasis
  hooks[lessThan] = [autolink, html]
  hooks[leftSquareBracket] = labelStartLink
  hooks[backslash] = [hardBreakEscape, characterEscape]
  hooks[rightSquareBracket] = labelEnd
  hooks[underscore] = emphasis
  hooks[graveAccent] = code

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
