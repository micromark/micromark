'use strict'

module.exports = html

var characters = require('./util/characters')
var characterReferences = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
var characterReferencesExpression = /["<>&]/g

var own = {}.hasOwnProperty

function html() {
  var definitions = Object.create(null)
  var requiresEncode = true
  var ignoreTags = false
  var atBreak = true
  var resource
  var reference
  var headingRank
  var buffers = [[]]

  var handlers = {
    enter: {
      code: onentercode,
      definition: onenterdefinition,
      definitionDestinationData: onenterdefinitiondestinationdata,
      definitionLabelData: onenterdefinitionlabeldata,
      definitionTitleData: onenterdefinitiontitledata,
      emphasis: onenteremphasis,
      fencedCodeFenceInfo: onenterfencedcodefenceinfo,
      fencedCodeFenceMeta: onenterfencedcodefencemeta,
      fencedCodeFenceStart: onenterfencedcodefencestart,
      indentedCode: onenterindentedcode,
      paragraph: onenterparagraph,
      referenceData: onenterresourcedata,
      resource: onenterresource,
      resourceDestination: onenterresourcedestination,
      resourceTitleData: onenterresourcetitledata,
      setextHeading: onentersetextheading,
      strong: onenterstrong
    },
    exit: {
      atxHeading: onexitatxheading,
      atxHeadingStartFence: onexitatxheadingstartfence,
      autolinkEmail: onexitautolinkemail,
      autolinkUri: onexitautolinkuri,
      characterEscapeCharacter: onexitcharacterescapecharacter,
      characterReferenceSequence: onexitcharacterreferencesequence,
      code: onexitcode,
      codeData: onexitcodedata,
      codeLineData: onexitcodelinedata,
      codeLineFeed: onexitcodelinefeed,
      data: onexitdata,
      definition: onexitdefinition,
      definitionDestinationData: onexitdefinitiondestinationdata,
      definitionLabelData: onexitdefinitionlabeldata,
      definitionTitleData: onexitdefinitiontitledata,
      emphasis: onexitemphasis,
      fencedCode: onexitflowcode,
      fencedCodeFenceInfo: onexitfencedcodefenceinfo,
      fencedCodeFenceMeta: onexitfencedcodefencemeta,
      fencedCodeFenceStart: onexitfencedcodefencestart,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      html: onexithtml,
      image: onexitimage,
      imageLabelStart: onexitimagelabelstart,
      indentedCode: onexitflowcode,
      lineFeed: onexitlinefeed,
      link: onexitlink,
      linkLabelStart: onexitlinklabelstart,
      paragraph: onexitparagraph,
      referenceData: onexitresourcedata,
      resourceDestination: onexitresourcedestination,
      resourceTitleData: onexitresourcetitledata,
      setextHeading: onexitsetextheading,
      setextHeadingContent: onexitsetextheadingcontent,
      setextHeadingSequence: onexitsetextheadingsequence,
      strong: onexitstrong,
      thematicBreak: onexitthematicbreak
    }
  }

  return adapt

  // To do, two strategies: stable and unstable.
  //
  // Stable means that parsing is 100% the same, whether a link reference
  // matches or not.
  //
  // This is what remark-parse currently does; it makes the most sense from
  // a parsing perspective, and probably also from an author’s perspective.
  //
  // The main problem where this is seen is:
  //
  // ```markdown
  // [[x]](https://a.com)
  //
  // [x]: https://b.com
  // ```
  //
  // (See: <https://twitter.com/wooorm/status/1260193277392945152>)
  //
  // - See if we can get “stable” parsing into CM.
  // - If not, add support for unstable CM-compliant mode.
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

  //
  // Adapters.
  //

  function onenterparagraph() {
    send(tag('<p>'))
  }

  function onexitparagraph() {
    send(tag('</p>'))
  }

  function onenterfencedcodefencestart() {
    send(tag('<pre><code'))
  }

  function onenterfencedcodefenceinfo() {
    buffer()
  }

  function onexitfencedcodefenceinfo() {
    var data = resume()
    atBreak = true
    send(tag(' class="language-' + data + '"'))
  }

  function onenterfencedcodefencemeta() {
    buffer()
  }

  function onexitfencedcodefencemeta() {
    resume()
    atBreak = true
  }

  function onexitfencedcodefencestart() {
    send(tag('>'))
  }

  function onenterindentedcode() {
    send(tag('<pre><code>'))
  }

  function onexitflowcode() {
    if (!atBreak) send('\n')
    send(tag('</code></pre>'))
    atBreak = false
  }

  function onexitimagelabelstart() {
    ignoreTags = true
    buffer()
  }

  function onexitlinklabelstart() {
    buffer()
  }

  function onexitimage(t, helpers) {
    var data = resume()
    var context
    var uri
    var title

    if (resource === undefined) {
      context = definitions[normalizeIdentifier(reference || data)]
      reference = undefined
    } else {
      context = resource
      resource = undefined
    }

    ignoreTags = false

    if (context) {
      uri = normalize(context.destination || '')
      title = context.title
      send(tag('<img src="' + encode(uri) + '" alt="'))
      send(encode(data || ''))
      send(
        tag('"' + (title === undefined ? '' : ' title="' + title + '"') + ' />')
      )
    } else {
      send(helpers.sliceSerialize(t))
    }
  }

  function onexitlink(t, helpers) {
    var data = resume()
    var context
    var uri
    var title

    if (resource === undefined) {
      context = definitions[normalizeIdentifier(reference || data)]
      reference = undefined
    } else {
      context = resource
      resource = undefined
    }

    if (context) {
      uri = normalize(context.destination || '')
      title = context.title
      send(
        tag(
          '<a href="' +
            encode(uri) +
            '"' +
            (title === undefined ? '' : ' title="' + title + '"') +
            '>'
        )
      )
      send(data)
      send(tag('</a>'))
    } else {
      send(helpers.sliceSerialize(t))
    }
  }

  function onenterresourcedata() {
    requiresEncode = false
    buffer()
  }

  function onexitresourcedata() {
    reference = resume()
    requiresEncode = true
  }

  function onenterresource() {
    resource = {}
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

  function onenterdefinition() {
    resource = {}
  }

  function onexitdefinition() {
    var id = normalizeIdentifier(resource.identifier)

    if (!own.call(definitions, id)) {
      definitions[id] = resource
    }

    resource = undefined
    atBreak = true
  }

  function onenterdefinitionlabeldata() {
    requiresEncode = false
    buffer()
  }

  function onexitdefinitionlabeldata() {
    resource.identifier = resume()
    requiresEncode = true
  }

  function onenterdefinitiondestinationdata() {
    requiresEncode = false
    buffer()
  }

  function onexitdefinitiondestinationdata() {
    resource.destination = resume()
    requiresEncode = true
  }

  function onenterdefinitiontitledata() {
    buffer()
  }

  function onexitdefinitiontitledata() {
    resource.title = resume()
  }

  function onexitatxheadingstartfence(t, helpers) {
    headingRank = helpers.sliceSerialize(t).length
    send(tag('<h' + headingRank + '>'))
    atBreak = false
  }

  function onexitatxheading() {
    send(tag('</h' + headingRank + '>'))
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
    send(tag('<' + name + '>'))
    send(data)
    send(tag('</' + name + '>'))
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
    send(tag('<br />'))
  }

  function onexitlinefeed(t, helpers) {
    if (atBreak) return
    atBreak = true
    send(helpers.sliceSerialize(t))
  }

  // To do: safe by default?
  function onexithtml(t, helpers) {
    atBreak = false
    send(helpers.sliceSerialize(t))
  }

  function onentercode() {
    atBreak = false
    send(tag('<code>'))
  }

  function onenteremphasis() {
    atBreak = false
    send(tag('<em>'))
  }

  function onenterstrong() {
    atBreak = false
    send(tag('<strong>'))
  }

  function onexitcodedata(t, helpers) {
    atBreak = false
    send(encode(helpers.sliceSerialize(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    atBreak = false
    send(tag('</code>'))
  }

  function onexitemphasis() {
    atBreak = false
    send(tag('</em>'))
  }

  function onexitstrong() {
    atBreak = false
    send(tag('</strong>'))
  }

  function onexitthematicbreak() {
    atBreak = false
    send(tag('<hr />'))
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
    send(tag('<a href="' + normalize(uri) + '">'))
    send(uri)
    send(tag('</a>'))
  }

  function onexitautolinkemail(t, helpers) {
    atBreak = false
    var uri = encode(helpers.sliceSerialize(t))
    send(tag('<a href="mailto:' + normalize(uri) + '">'))
    send(uri)
    send(tag('</a>'))
  }

  function tag(value) {
    return ignoreTags === true ? '' : value
  }

  function encode(value) {
    return requiresEncode === true
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

function normalizeIdentifier(value) {
  return (
    value
      // To do: should we trim?
      // .trim()
      .replace(/[ \t\r\n]+/g, ' ')
      .toLowerCase()
      .toUpperCase()
  )
}
