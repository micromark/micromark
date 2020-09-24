exports.text = initializeFactory('text')
exports.string = initializeFactory('string')
exports.resolver = {resolveAll: resolveAllText}

var codes = require('../character/codes')
var types = require('../constant/types')

function initializeFactory(field) {
  return {tokenize: initializeText, resolveAll: resolveAllText}

  function initializeText(effects) {
    var self = this
    var constructs = this.parser.constructs[field]
    var text = effects.attempt(constructs, start, dataStart)

    return start

    function start(code) {
      // Markup or EOF.
      if (atBreak(code)) {
        return text(code)
      }

      return dataStart(code)
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
      if (atBreak(code)) {
        effects.exit(types.data)
        return text(code)
      }

      // Data.
      effects.consume(code)
      return data
    }

    function atBreak(code) {
      var list = constructs[code]
      var index = -1

      if (code === codes.eof) {
        return true
      }

      if (list) {
        while (++index < list.length) {
          if (matchesPrevious(list[index])) {
            return true
          }
        }
      }
    }

    function matchesPrevious(construct) {
      return !construct.previous || construct.previous.call(self, self.previous)
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
