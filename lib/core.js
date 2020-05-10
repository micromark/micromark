'use strict'

module.exports = micromark

var assert = require('assert')
var autolink = require('./tokenize/text/autolink')
var characterEscape = require('./tokenize/text/character-escape')
var characterReference = require('./tokenize/text/character-reference')
var code = require('./tokenize/text/code')
var hardBreakEscape = require('./tokenize/text/hard-break-escape')
var hardBreakTrailing = require('./tokenize/text/hard-break-trailing')
var html = require('./tokenize/text/html')

var eof = NaN

var lineFeed = 10 // '\n'
var space = 32 // ' '
var ampersand = 38 // '&'
var lessThan = 60 // '<'
var backslash = 92 // '\'
var graveAccent = 96 // '`'

var own = {}.hasOwnProperty

// Text only, for now.
var allHooks = {
  text: {}
}

allHooks.text[space] = hardBreakTrailing
allHooks.text[ampersand] = characterReference
allHooks.text[lessThan] = [autolink, html]
allHooks.text[backslash] = [hardBreakEscape, characterEscape]
allHooks.text[graveAccent] = code

function micromark(callback) {
  var buffer = ''
  var index = 0
  var place = {line: 1, column: 1, offset: index, index: index}

  // Parser state.
  var state = textStart
  var stack = [] // Current open tokens.
  var queue // Event queue.

  var effects = {
    previous: eof,
    consume: consume,
    enter: enter,
    exit: exit
  }

  // Adapters.
  var atBreak = true
  var adapters = {
    enter: {
      code: onentercode
    },
    exit: {
      autolinkUri: onexitautolinkuri,
      autolinkEmail: onexitautolinkemail,
      characterEscapeCharacter: onexitcharacterescapecharacter,
      characterReferenceSequence: onexitcharacterreferencesequence,
      code: onexitcode,
      codeData: onexitcodedata,
      data: onexitdata,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      html: onexithtml
    }
  }

  // Hookable states.
  var text = hookable(allHooks.text, notText)

  var head = false

  // Run the state machine.
  return write

  function write(value) {
    if (value) {
      if (!head) {
        callback('<p>')
        head = true
      }

      buffer += value
    }

    main(value !== value)

    if (value !== value) {
      if (head) callback('</p>')
      assert.equal(stack.length, 0, 'expected no tokens on the stack')
    }
  }

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main(end) {
    // If `end`, we also feed an EOF. Which is finally consumed by the last
    // state.
    var offset = end ? 1 : 0

    while (index < buffer.length + offset) {
      state = state(buffer.charCodeAt(index))
    }
  }

  // Get the current point.
  function now() {
    return Object.assign({}, place)
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(typeof code, 'number', 'expected a numeric code')
    console.log('consume:', state.name, code)

    // Line ending; assumes CR is not used (remark removes those).
    if (code === lineFeed) {
      place.line++
      place.column = 1
    }
    // Anything else.
    else {
      place.column++
    }

    index++

    place.offset++
    place.index = index

    effects.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: now()}

    console.group('enter:', type)

    if (queue) {
      queue.push(['enter', token])
    } else {
      emit('enter', token)
    }

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type) {
    assert.equal(
      stack[stack.length - 1].type,
      type,
      'expected exit token to match current token'
    )

    var token = stack.pop()

    token.end = now()

    assert.notEqual(
      token.start.index,
      token.end.index,
      'expected non-empty token'
    )

    console.groupEnd()
    console.info('exit:', token.type)

    if (queue) {
      queue.push(['exit', token])
    } else {
      emit('exit', token)
    }

    return token
  }

  // Emit a token.
  function emit(name, token) {
    var map = adapters[name]

    if (own.call(map, token.type)) {
      map[token.type](token)
    }

    // To do: flushing too often probably leads to unneeded memory operations.
    // Once per `write` should be fine? 🤷‍
    if (name === 'exit' && index !== 0 && queue === undefined) {
      buffer = buffer.slice(index)
      index = 0
      place.index = index
    }
  }

  function slice(token) {
    return buffer.slice(token.start.index, token.end.index)
  }

  //
  // Adapters.
  //

  function onexitdata(t) {
    var value = slice(t).replace(/[ \t]*\n[ \t]*/g, '\n')

    if (atBreak) {
      value = value.replace(/^[ \t]+/, '')
    }

    atBreak =
      (atBreak && value.length === 0) ||
      value.charCodeAt(value.length - 1) === lineFeed

    callback(encode(value))
  }

  function onexithardbreak() {
    atBreak = true
    callback('<br />')
  }

  function onexithtml(t) {
    atBreak = false
    callback(slice(t))
  }

  function onentercode() {
    atBreak = false
    callback('<code>')
  }

  function onexitcodedata(t) {
    atBreak = false
    callback(encode(slice(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    atBreak = false
    callback('</code>')
  }

  function onexitcharacterescapecharacter(t) {
    atBreak = false
    callback(encode(slice(t)))
  }

  function onexitcharacterreferencesequence(t) {
    atBreak = false
    callback(encode(t.value))
  }

  function onexitautolinkuri(t) {
    atBreak = false
    var uri = encode(slice(t))
    callback('<a href="' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(t) {
    atBreak = false
    var uri = encode(slice(t))
    callback('<a href="mailto:' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function encode(value) {
    var map = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
    var re = /["<>&]/g
    return value.replace(re, replace)
    function replace(d) {
      return '&' + map[d] + ';'
    }
  }

  //
  // State machine.
  //

  function textStart() {
    return textInitial
  }

  function textInitial() {
    return text
  }

  function notText(code) {
    // Data.
    if (code === code) {
      enter('data')
      consume(code)
      return data
    }

    // EOF:
    consume(code)
    return text
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(allHooks.text, code) || code !== code) {
      exit('data')
      return text
    }

    // Data.
    consume(code)
    return data
  }

  function hookable(hooks, bogus) {
    return hooked

    function hooked(code) {
      if (own.call(hooks, code)) {
        return attempt(hooks[code], hooked, bogus)
      }

      return bogus
    }
  }

  function attempt(hooks, returnState, bogusState) {
    var multiple = 'length' in hooks
    var hookIndex = 0
    var startIndex = index
    var startPlace = now()
    var startDepth = stack.length
    var hook = multiple ? hooks[hookIndex] : hooks

    queue = []

    return hook.tokenize(effects, ok, nok)

    function ok() {
      // To do: resolve is horrible. Make it pretty.
      var resolve = hook.resolve || identity

      resolve(queue).forEach(([name, token]) => emit(name, token))

      queue = undefined
      return returnState
    }

    function nok() {
      // Clear debugging.
      var n = 99
      while (n--) console.groupEnd()
      console.info('nok :(')

      // Reset.
      index = startIndex
      place = Object.assign({}, startPlace)
      stack = stack.slice(0, startDepth)
      queue = undefined

      // Next hook.
      if (multiple && ++hookIndex < hooks.length) {
        queue = []
        hook = hooks[hookIndex]
        return hook.tokenize(effects, ok, nok)
      }

      return bogusState
    }
  }
}

function identity(x) {
  return x
}
