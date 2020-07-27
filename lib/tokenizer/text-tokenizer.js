module.exports = text

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')
var attention = require('../tokenize/attention')
var autolink = require('../tokenize/autolink')
var characterEscape = require('../tokenize/character-escape')
var characterReference = require('../tokenize/character-reference')
var code = require('../tokenize/code-span')
var hardBreakEscape = require('../tokenize/hard-break-escape')
var html = require('../tokenize/html-span')
var labelEnd = require('../tokenize/label-end')
var labelImage = require('../tokenize/label-start-image')
var labelLink = require('../tokenize/label-start-link')
var whitespace = require('../tokenize/whitespace')

// To do: start and initial states in the future.
function text(effects) {
  var hooks = {}

  hooks[codes.cr] = whitespace
  hooks[codes.lf] = whitespace
  hooks[codes.crlf] = whitespace
  hooks[codes.ht] = whitespace
  hooks[codes.space] = whitespace
  hooks[codes.exclamationMark] = labelImage
  hooks[codes.ampersand] = characterReference
  hooks[codes.asterisk] = attention
  hooks[codes.lessThan] = [autolink, html]
  hooks[codes.leftSquareBracket] = labelLink
  hooks[codes.backslash] = [hardBreakEscape, characterEscape]
  hooks[codes.rightSquareBracket] = labelEnd
  hooks[codes.underscore] = attention
  hooks[codes.graveAccent] = code

  var text = effects.createConstructsAttempt(hooks, after, dataStart)

  return text

  function after(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    // Otherwise, try the hooks again.
    return text(code)
  }

  function dataStart(code) {
    effects.enter(types.data)
    effects.consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code === codes.eof) {
      effects.exit(types.data)
      return text
    }

    // Data.
    effects.consume(code)
    return data
  }
}
