'use strict'

module.exports = html

var characters = require('./util/characters')
var characterReferences = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
var characterReferencesExpression = /["<>&]/g

var own = {}.hasOwnProperty

function html() {
  var requiresEncode = true
  var atBreak = true
  var label
  var resource
  var headingRank
  var buffers = [[]]

  var handlers = {
    enter: {
      paragraph: onenterparagraph,
      code: onentercode,
      emphasis: onenteremphasis,
      indentedCode: onenterindentedcode,
      fencedCodeFenceStart: onenterfencedcodefencestart,
      fencedCodeFenceInfo: onenterfencedcodefenceinfo,
      fencedCodeFenceMeta: onenterfencedcodefencemeta,
      image: onenterimage,
      imageLabel: onenterlabel,
      link: onenterlink,
      linkLabel: onenterlabel,
      resource: onenterresource,
      resourceDestination: onenterresourcedestination,
      resourceTitleData: onenterresourcetitledata,
      setextHeading: onentersetextheading,
      strong: onenterstrong
    },
    exit: {
      paragraph: onexitparagraph,
      atxHeadingStartFence: onexitatxheadingstartfence,
      atxHeading: onexitatxheading,
      autolinkUri: onexitautolinkuri,
      autolinkEmail: onexitautolinkemail,
      characterEscapeCharacter: onexitcharacterescapecharacter,
      characterReferenceSequence: onexitcharacterreferencesequence,
      code: onexitcode,
      codeData: onexitcodedata,
      data: onexitdata,
      codeLineData: onexitcodelinedata,
      codeLineFeed: onexitcodelinefeed,
      emphasis: onexitemphasis,
      fencedCodeFenceStart: onexitfencedcodefencestart,
      fencedCodeFenceInfo: onexitfencedcodefenceinfo,
      fencedCodeFenceMeta: onexitfencedcodefencemeta,
      fencedCode: onexitflowcode,
      indentedCode: onexitflowcode,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      html: onexithtml,
      image: onexitimage,
      link: onexitlink,
      lineFeed: onexitlinefeed,
      resourceDestination: onexitresourcedestination,
      resourceTitleData: onexitresourcetitledata,
      setextHeadingContent: onexitsetextheadingcontent,
      setextHeadingSequence: onexitsetextheadingsequence,
      setextHeading: onexitsetextheading,
      strong: onexitstrong,
      thematicBreak: onexitthematicbreak
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

    /* istanbul ignore next - we may have buffers open. TODO: test. */
    if (buffers.length !== 1) {
      return ''
    }

    result = buffers[0].join('')
    buffers[0] = []
    return result
  }

  function send(slice) {
    buffers[buffers.length - 1].push(slice)
  }

  function buffer() {
    buffers.push([])
  }

  function resume() {
    return buffers.pop().join('')
  }

  // Ugly for now.
  function onenterparagraph() {
    send('<p>')
  }

  function onexitparagraph() {
    send('</p>')
  }

  function onenterfencedcodefencestart() {
    send('<pre><code')
  }

  function onenterfencedcodefenceinfo() {
    buffer()
  }

  function onexitfencedcodefenceinfo() {
    var data = resume()
    atBreak = true
    send(' class="language-' + data + '"')
  }

  function onenterfencedcodefencemeta() {
    buffer()
  }

  function onexitfencedcodefencemeta() {
    resume()
    atBreak = true
  }

  function onexitfencedcodefencestart() {
    send('>')
  }

  function onenterindentedcode() {
    send('<pre><code>')
  }

  function onexitflowcode() {
    if (!atBreak) send('\n')
    send('</code></pre>')
    atBreak = false
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
      uri = normalize(context.destination || '')
      title = context.title
      send(
        '<img src="' +
          uri +
          '" alt="' +
          (data || '') +
          '"' +
          (title === undefined ? '' : ' title="' + title + '"') +
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
      uri = normalize(context.destination || '')
      title = context.title
      send(
        '<a href="' +
          uri +
          '"' +
          (title === undefined ? '' : ' title="' + title + '"') +
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
    label = helpers.sliceSerialize(t)
  }

  function onenterresourcedestination() {
    requiresEncode = false
    buffer()
  }

  function onexitresourcedestination() {
    resource.destination = resume()
    requiresEncode = true
  }

  function onenterresourcetitledata() {
    buffer()
  }

  function onexitresourcetitledata() {
    resource.title = resume()
  }

  //
  // Adapters.
  //

  function onexitatxheadingstartfence(t, helpers) {
    headingRank = helpers.sliceSerialize(t).length
    send('<h' + headingRank + '>')
    atBreak = false
  }

  function onexitatxheading() {
    send('</h' + headingRank + '>')
    headingRank = undefined
    atBreak = false
  }

  function onentersetextheading() {
    buffer()
  }

  function onexitsetextheadingcontent() {
    // Ignore EOL.
    atBreak = true
  }

  function onexitsetextheadingsequence(t, helpers) {
    headingRank = helpers.sliceSerialize(t).charAt(0) === '=' ? 1 : 2
  }

  function onexitsetextheading() {
    var data = resume()
    var name = 'h' + headingRank
    send('<' + name + '>')
    send(data)
    send('</' + name + '>')
    atBreak = false
  }

  function onexitdata(t, helpers) {
    // To do: this should happen in block parsing.
    var value = helpers.sliceSerialize(t).replace(/[ \t]*\n[ \t]*/g, '\n')

    if (atBreak) {
      value = value.replace(/^[ \t]+/, '')
    }

    atBreak =
      (atBreak && value.length === 0) ||
      value.charCodeAt(value.length - 1) === characters.lineFeed

    send(encode(value))
  }

  function onexitcodelinedata(t, helpers) {
    var value = helpers.sliceSerialize(t)
    send(encode(value))
    atBreak = false
  }

  function onexitcodelinefeed(t, helpers) {
    send(encode(helpers.sliceSerialize(t)))
    atBreak = true
  }

  function onexithardbreak() {
    atBreak = false
    send('<br />')
  }

  function onexitlinefeed(t, helpers) {
    if (atBreak) return
    atBreak = true
    send(helpers.sliceSerialize(t))
  }

  function onexithtml(t, helpers) {
    atBreak = false
    send(helpers.sliceSerialize(t))
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
    send(encode(helpers.sliceSerialize(t).replace(/\n/g, ' ')))
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

  function onexitthematicbreak() {
    atBreak = false
    send('<hr />')
  }

  function onexitcharacterescapecharacter(t, helpers) {
    atBreak = false
    send(encode(helpers.sliceSerialize(t)))
  }

  function onexitcharacterreferencesequence(t) {
    atBreak = false
    send(encode(t.value))
  }

  function onexitautolinkuri(t, helpers) {
    atBreak = false
    var uri = encode(helpers.sliceSerialize(t))
    send('<a href="' + normalize(uri) + '">' + uri + '</a>')
  }

  function onexitautolinkemail(t, helpers) {
    atBreak = false
    var uri = encode(helpers.sliceSerialize(t))
    send('<a href="mailto:' + normalize(uri) + '">' + uri + '</a>')
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

function normalize(url) {
  return encodeURI(decodeURI(url || ''))
}
