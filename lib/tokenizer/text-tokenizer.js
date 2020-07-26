module.exports = text

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')
var autolink = require('../tokenize/text/autolink')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')
var code = require('../tokenize/text/code')
var attention = require('../tokenize/text/attention')
var hardBreakEscape = require('../tokenize/text/hard-break-escape')
var whitespace = require('../tokenize/text/whitespace')
var html = require('../tokenize/text/html')
var labelImage = require('../tokenize/text/label-start-image')
var labelLink = require('../tokenize/text/label-start-link')
var labelEnd = require('../tokenize/text/label-end')

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
