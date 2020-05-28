exports.tokenize = tokenizeLabelEndResource
exports.resolveTo = resolveTo
exports.resolveAll = resolveAll

var characters = require('../../util/characters')
var clone = require('../../util/clone-point')

function resolveAll(events) {
  var index = -1
  var length = events.length
  var token

  while (++index < length) {
    token = events[index][1]

    if (
      token.type === 'potentialLabelStartImage' ||
      token.type === 'potentialLabelStartLink' ||
      token.type === 'potentialLabelEnd'
    ) {
      token.type = 'data'
    }
  }

  return events
}

function resolveTo(events, helpers) {
  var end = events.length - 2
  var index = end - 1
  var close = events[end][1]
  var open
  var event
  var token
  var type

  // Find an opening.
  while (index !== -1) {
    event = events[index]
    token = event[1]

    if (
      event[0] === 'enter' &&
      (token.type === 'potentialLabelStartImage' ||
        token.type === 'potentialLabelStartLink')
    ) {
      open = token
      break
    }

    index--
  }

  // No opening found, what we thought was a label end is, in fact, data.
  if (!open) {
    close.type = 'data'
    events[end + 1][1].type = 'data'
    return events
  }

  // It’s a link or an image!
  type = open.type === 'potentialLabelStartLink' ? 'link' : 'image'

  open.type = type + 'LabelStart'
  close.type = type + 'LabelEnd'

  var label = {
    type: type + 'Label',
    start: clone(open.start),
    end: clone(close.end)
  }
  var group = {
    type: type,
    start: clone(open.start),
    end: clone(close.end)
  }

  // Add the label, and its wrapper.
  events.splice(index, 0, ['enter', group, helpers], ['enter', label, helpers])
  events.push(['exit', label, helpers], ['exit', group, helpers])

  // Remove earlier openings, as we can’t have links in links.
  if (type === 'link') {
    // console.log('todo: remove earlier openings:', events)
    // while (index !== -1) {
    //   event = events[index]
    //   token = event[1]
    //
    //   // To do: remove `potentialLabelStartImage`?
    //   if (token.type === 'potentialLabelStartLink') {
    //     token.type = 'data'
    //   }
    //
    //   index--
    // }
  }

  return events
}

function tokenizeLabelEndResource(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.rightSquareBracket) return nok(code)

    effects.enter('potentialLabelEnd')
    effects.consume(code)
    effects.exit('potentialLabelEnd')

    return ok(code)
  }
}
