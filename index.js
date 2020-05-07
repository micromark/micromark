'use strict'

module.exports = mm

var assert = require('assert')
var stringifyEntities = require('stringify-entities')
var serializeCharCode = require('./util-serialize-char-code')
var serializeFormattedCode = require('./util-serialize-formatted-code')
var autolink = require('./lib/tokenize/text/autolink')
var code = require('./lib/tokenize/text/code')
var characterReference = require('./lib/tokenize/text/character-reference')
var characterEscape = require('./lib/tokenize/text/character-escape')

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

function mm(value) {
  var index = 0
  var place = {line: 1, column: 1, offset: index, index: index}
  var out = []

  // Parser state.
  var state = textStart
  var stack = [] // Current open tokens.
  var settled = false
  var queue // Event queue.

  var effects = {
    prev: previous,
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

  // Run the state machine.
  main()

  assert.equal(stack.length, 0)

  console.info('settled!', settled)
  return '<p>' + out.join('') + '</p>'

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main() {
    /* eslint-disable-next-line no-unmodified-loop-condition */
    while (!settled) {
      state = state(value.charCodeAt(index))
    }
  }

  // Get the current point.
  function now() {
    return Object.assign({}, place)
  }

  function previous() {
    console.log('prev:index', index)
    return index === 0 ? NaN : value.charCodeAt(index - 1)
  }

  // Move a character forward.
  function consume() {
    var c = value.charCodeAt(index)
    console.info('consume:', serializeCharCode(c), serializeFormattedCode(c))
    // Line ending; assumes CR is not used (remark removes those).
    if (value.charCodeAt(index) === lineFeed) {
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
  }

  // Start a token.
  function enter(type) {
    console.group('enter: ' + type)
    var token = {type: type, start: now()}

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
    assert.equal(stack[stack.length - 1].type, type)
    var token = stack.pop()

    token.end = now()

    assert.notEqual(token.start.index, token.end.index)

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
  }

  function slice(token) {
    return value.slice(token.start.index, token.end.index)
  }

  //
  // Adapters.
  //

  function onexitdata(t) {
    out.push(encode(slice(t)))
  }

  function onentercode() {
    out.push('<code>')
  }

  function onexitcodedata(t) {
    out.push(encode(slice(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    out.push('</code>')
  }

  function onexitcharacterescapecharacter(t) {
    out.push(encode(slice(t)))
  }

  function onexitcharacterreferencesequence(t) {
    out.push(encode(t.value))
  }

  function onexitautolinkuri(t) {
    var uri = encode(slice(t))
    out.push('<a href="' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(t) {
    var uri = encode(slice(t))
    out.push('<a href="mailto:' + encodeURI(uri) + '">' + uri + '</a>')
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

    // Code.
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

    // EOF.
    settled = true
    return text
  }

  // To do: fix this stuff!!!
  function notCode() {
    enter('data')
    consume()
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code !== code) {
      exit('data')
      return text
    }

    // Data.
    consume()
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
      console.info('ok!')
      resolve(queue).forEach(([name, token]) => emit(name, token))
      queue = undefined
      return returnState
    }

    function nok() {
      console.groupEnd()
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
