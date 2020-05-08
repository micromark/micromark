'use strict'

module.exports = micromark

var assert = require('assert')
var stringifyEntities = require('stringify-entities')
var autolink = require('./tokenize/text/autolink')
var code = require('./tokenize/text/code')
var characterReference = require('./tokenize/text/character-reference')
var characterEscape = require('./tokenize/text/character-escape')

var eof = NaN

var lineFeed = 10 // '\n'
// var quotationMark = 34 // '"'
var ampersand = 38 // '&'
// var apostrophe = 39 // "'"
// var dash = 45 // '-'
// var dot = 46 // '.'
// var slash = 47 // '/'
// var colon = 58 // ':'
var lessThan = 60 // '<'
// var equalsTo = 61 // '='
// var greaterThan = 62 // '>'
var backslash = 92 // '\'
var graveAccent = 96 // '`'
// var leftCurlyBrace = 123 // '{'
// var rightCurlyBrace = 125 // '}'

var own = {}.hasOwnProperty

// Text only, for now.
var hooks = {}

hooks[ampersand] = characterReference
hooks[lessThan] = autolink
hooks[backslash] = characterEscape
hooks[graveAccent] = code

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
  var adapters = {
    enter: {
      code: onentercode
    },
    exit: {
      data: onexitdata,
      codeData: onexitcodedata,
      codeWhitespace: onexitcodedata,
      characterEscapeCharacter: onexitcharacterescapecharacter,
      characterReferenceSequence: onexitcharacterreferencesequence,
      autolinkUri: onexitautolinkuri,
      autolinkEmail: onexitautolinkemail,
      code: onexitcode
    }
  }

  var head = false

  // Run the state machine.
  return write

  function write(value) {
    console.log('write:', [value])
    if (value) {
      if (!head) callback('<p>')
      head = true
      buffer += value
    }

    main(value !== value)

    if (value !== value) {
      if (head) callback('</p>')
      else callback('<p></p>')
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
    var handlers = adapters[name]

    if (own.call(handlers, token.type)) {
      handlers[token.type](token)
    }

    if (name === 'exit') {
      flush()
    }
  }

  function flush() {
    if (index === 0 || queue !== undefined) {
      return
    }

    buffer = buffer.slice(index)
    index = 0
    place.index = index
  }

  function slice(token) {
    return buffer.slice(token.start.index, token.end.index)
  }

  //
  // Adapters.
  //

  function onexitdata(t) {
    callback(encode(slice(t).replace(/[ \t]*\n[ \t]*/g, '\n')))
  }

  function onentercode() {
    callback('<code>')
  }

  function onexitcodedata(t) {
    callback(encode(slice(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    callback('</code>')
  }

  function onexitcharacterescapecharacter(t) {
    callback(encode(slice(t)))
  }

  function onexitcharacterreferencesequence(t) {
    callback(encode(t.value))
  }

  function onexitautolinkuri(t) {
    var uri = encode(slice(t))
    callback('<a href="' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(t) {
    var uri = encode(slice(t))
    callback('<a href="mailto:' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function encode(value) {
    return stringifyEntities(value, {
      useNamedReferences: true,
      subset: ['"', '<', '>', '&']
    })
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

  function text(code) {
    var hook
    var attempt

    // Hooked.
    if (own.call(hooks, code)) {
      hook = hooks[code]
      attempt = createAttempt(hook, text, notCode)
      return hook.tokenize(effects, attempt.ok, attempt.nok)
    }

    // Data.
    if (code === code) {
      enter('data')
      return data
    }

    // EOF:
    consume(code)
    return text
  }

  // To do: fix this stuff!!!
  function notCode(code) {
    enter('data')
    consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code !== code) {
      exit('data')
      return text
    }

    // Data.
    consume(code)
    return data
  }

  function createAttempt(hook, returnState, bogusState) {
    var resolve = hook.resolve || identity
    var startIndex = index
    var startPlace = now()
    var startDepth = stack.length

    queue = []

    return {ok: ok, nok: nok}

    function ok() {
      resolve(queue).forEach(([name, token]) => emit(name, token))
      queue = undefined
      return returnState
    }

    function nok() {
      var n = 10
      while (n--) console.groupEnd()
      console.info('nok :(')
      index = startIndex
      place = startPlace
      stack = stack.slice(0, startDepth)
      queue = undefined
      return bogusState
    }
  }
}

function identity(x) {
  return x
}
