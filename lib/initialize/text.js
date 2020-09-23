exports.text = initializeFactory('text')
exports.string = initializeFactory('string')
exports.resolver = {resolveAll: resolveAllText}

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')

function initializeFactory(field) {
  return {tokenize: initializeText, resolveAll: resolveAllText}

  function initializeText(effects) {
    var constructs = this.parser.constructs[field]
    var text = effects.attempt(constructs, after, dataStart)

    return text

    function after(code) {
      // Make sure we eat EOFs.
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      // Otherwise, try the constructs again.
      return text(code)
    }

    function dataStart(code) {
      // Make sure we eat EOFs.
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      effects.enter(types.data)
      effects.consume(code)
      return data
    }

    function data(code) {
      // Markup or EOF.
      if (code === codes.eof || own.call(constructs, code)) {
        effects.exit(types.data)
        return text(code)
      }

      // Data.
      effects.consume(code)
      return data
    }
  }
}

function resolveAllText(events) {
  var index = -1
  var dataEnter
  var event

  while (++index <= events.length) {
    event = events[index]

    if (dataEnter === undefined) {
      if (event && event[0] === 'enter' && event[1].type === types.data) {
        dataEnter = index
        index++
      }
    } else if (!event || event[1].type !== types.data) {
      // Don’t do anything if there is one data token.
      if (index !== dataEnter + 2) {
        events[dataEnter][1].end = events[index - 1][1].end
        events.splice(dataEnter + 2, index - dataEnter - 2)
        index = dataEnter + 2
      }

      dataEnter = undefined
    }
  }

  return events
}
