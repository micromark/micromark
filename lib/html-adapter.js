'use strict'

module.exports = html

var characterReferences = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
var characterReferencesExpression = /["<>&]/g
var lineFeed = 10 // '\n'

var own = {}.hasOwnProperty

function html() {
  var requiresEncode = true
  var atBreak = true
  var label
  var resource
  var buffers = [[]]

  var handlers = {
    enter: {
      markdown: onentermarkdown,
      code: onentercode,
      emphasis: onenteremphasis,
      image: onenterimage,
      imageLabel: onenterlabel,
      link: onenterlink,
      linkLabel: onenterlabel,
      resource: onenterresource,
      resourceDestination: onenterresourcedestination,
      strong: onenterstrong
    },
    exit: {
      markdown: onexitmarkdown,
      autolinkUri: onexitautolinkuri,
      autolinkEmail: onexitautolinkemail,
      characterEscapeCharacter: onexitcharacterescapecharacter,
      characterReferenceSequence: onexitcharacterreferencesequence,
      code: onexitcode,
      codeData: onexitcodedata,
      data: onexitdata,
      emphasis: onexitemphasis,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      html: onexithtml,
      image: onexitimage,
      link: onexitlink,
      resourceDestination: onexitresourcedestination,
      resourceTitle: onexitresourcetitle,
      strong: onexitstrong
    }
  }

  return adapt

  function adapt(events) {
    var length = events.length
    var index = -1
    var event
    var token
    var map
    var result

    while (++index < length) {
      event = events[index]
      map = handlers[event[0]]
      token = event[1]

      if (own.call(map, token.type)) {
        map[token.type](token, event[2])
      }
    }

    if (buffers.length === 1) {
      result = buffers[0].join('')
      buffers[0] = []
    } else {
      result = ''
    }

    return result
  }

  function send(slice) {
    buffers[buffers.length - 1].push(slice)
  }

  function buffer() {
    buffers.push([])
  }

  function resume() {
    var result = buffers.pop().join('')
    if (buffers.length === 0) buffers = undefined
    return result
  }

  // Ugly for now.
  function onentermarkdown() {
    send('<p>')
  }

  function onexitmarkdown() {
    send('</p>')
  }

  function onenterimage() {
    buffer()
  }

  function onenterlink() {
    buffer()
  }

  function onexitimage() {
    var context
    var data
    var uri
    var title

    if (resource) {
      context = resource
      resource = undefined
    }

    if (context) {
      data = resume()
      uri = encodeURI(context.destination || '')
      title = context.title ? encode(context.title.slice(1, -1)) : undefined
      send(
        '<img src="' +
          uri +
          '" alt="' +
          (data || '') +
          '"' +
          (title ? ' title="' + title + '"' : '') +
          ' />'
      )
    } else {
      resume()
      send(label)
    }
  }

  function onexitlink() {
    var context
    var data
    var uri
    var title

    if (resource) {
      context = resource
      resource = undefined
    }

    if (context) {
      data = resume()
      uri = encodeURI(context.destination || '')
      title = context.title ? encode(context.title.slice(1, -1)) : undefined
      send(
        '<a href="' +
          uri +
          '"' +
          (title ? ' title="' + title + '"' : '') +
          '>' +
          data +
          '</a>'
      )
    } else {
      resume()
      send(label)
    }
  }

  function onenterresource() {
    resource = {}
  }

  function onenterlabel(t, helpers) {
    label = helpers.slice(t)
  }

  function onenterresourcedestination() {
    requiresEncode = false
    buffer()
  }

  function onexitresourcedestination() {
    requiresEncode = true
    resource.destination = resume()
  }

  function onexitresourcetitle(t, helpers) {
    resource.title = helpers.slice(t)
  }

  //
  // Adapters.
  //

  function onexitdata(t, helpers) {
    // To do: this should happen in block parsing.
    var value = helpers.slice(t).replace(/[ \t]*\n[ \t]*/g, '\n')

    if (atBreak) {
      value = value.replace(/^[ \t]+/, '')
    }

    atBreak =
      (atBreak && value.length === 0) ||
      value.charCodeAt(value.length - 1) === lineFeed

    send(encode(value))
  }

  function onexithardbreak() {
    atBreak = true
    send('<br />')
  }

  function onexithtml(t, helpers) {
    atBreak = false
    send(helpers.slice(t))
  }

  function onentercode() {
    atBreak = false
    send('<code>')
  }

  function onenteremphasis() {
    atBreak = false
    send('<em>')
  }

  function onenterstrong() {
    atBreak = false
    send('<strong>')
  }

  function onexitcodedata(t, helpers) {
    atBreak = false
    send(encode(helpers.slice(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    atBreak = false
    send('</code>')
  }

  function onexitemphasis() {
    atBreak = false
    send('</em>')
  }

  function onexitstrong() {
    atBreak = false
    send('</strong>')
  }

  function onexitcharacterescapecharacter(t, helpers) {
    atBreak = false
    send(encode(helpers.slice(t)))
  }

  function onexitcharacterreferencesequence(t) {
    atBreak = false
    send(encode(t.value))
  }

  function onexitautolinkuri(t, helpers) {
    atBreak = false
    var uri = encode(helpers.slice(t))
    send('<a href="' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(t, helpers) {
    atBreak = false
    var uri = encode(helpers.slice(t))
    send('<a href="mailto:' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function encode(value) {
    return requiresEncode
      ? value.replace(characterReferencesExpression, replace)
      : value
    function replace(value) {
      return '&' + characterReferences[value] + ';'
    }
  }
}
