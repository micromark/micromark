'use strict'

module.exports = html

var lineFeed = 10 // '\n'

function html(callback) {
  var atBreak = true
  var label
  var resource
  var buffers

  return {
    enter: {
      markdown: onentermarkdown,
      code: onentercode,
      emphasis: onenteremphasis,
      image: onenterimage,
      imageLabel: onenterlabel,
      link: onenterlink,
      linkLabel: onenterlabel,
      resource: onenterresource,
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

  function send(slice) {
    if (buffers === undefined) {
      callback(slice)
    } else {
      buffers[buffers.length - 1].push(slice)
    }
  }

  function buffer() {
    var currentBuffer = []
    if (buffers === undefined) buffers = []
    buffers.push(currentBuffer)
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

  function onexitimage(helpers, t) {
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

    console.log('exit:', context)
  }

  function onexitlink(helpers, t) {
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

  function onenterlabel(helpers, t) {
    label = helpers.slice(t)
  }

  function onexitresourcedestination(helpers, t) {
    resource.destination = helpers.slice(t)
  }

  function onexitresourcetitle(helpers, t) {
    resource.title = helpers.slice(t)
  }

  //
  // Adapters.
  //

  function onexitdata(helpers, t) {
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

  function onexithtml(helpers, t) {
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

  function onexitcodedata(helpers, t) {
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

  function onexitcharacterescapecharacter(helpers, t) {
    atBreak = false
    send(encode(helpers.slice(t)))
  }

  function onexitcharacterreferencesequence(helpers, t) {
    atBreak = false
    send(encode(t.value))
  }

  function onexitautolinkuri(helpers, t) {
    atBreak = false
    var uri = encode(helpers.slice(t))
    send('<a href="' + encodeURI(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(helpers, t) {
    atBreak = false
    var uri = encode(helpers.slice(t))
    send('<a href="mailto:' + encodeURI(uri) + '">' + uri + '</a>')
  }
}

function encode(value) {
  var map = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
  var re = /["<>&]/g
  return value.replace(re, replace)
  function replace(d) {
    return '&' + map[d] + ';'
  }
}
