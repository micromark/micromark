'use strict'

module.exports = html

var characters = require('./util/characters')
var characterReferences = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
var characterReferencesExpression = /["<>&]/g

var own = {}.hasOwnProperty

function html() {
  var definitions = Object.create(null)
  var codeInFlow = false
  var codeSeenData = false
  var codeSlurpedLineEnding = false
  var definitionSlurpLineEnding = false
  var safe = false
  var requiresEncode = true
  var ignoreTags = false
  var mediaStack = []
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
      label: onenterlabel,
      reference: onenterreference,
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
      htmlFlow: onexithtmlflow,
      htmlSpan: onexithtmlspan,
      image: onexitmedia,
      imageLabelStart: onexitimagelabelstart,
      indentedCode: onexitflowcode,
      label: onexitlabel,
      labelData: onexitlabeldata,
      lineEnding: onexitlineending,
      link: onexitmedia,
      linkLabelStart: onexitlinklabelstart,
      paragraph: onexitparagraph,
      reference: onexitreference,
      referenceData: onexitreferencedata,
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

  function last() {
    var buf = buffers[buffers.length - 1]
    var slice = buf[buf.length - 1]
    return slice.charCodeAt(slice.length - 1)
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
    send(tag(' class="language-' + data + '"'))
  }

  function onenterfencedcodefencemeta() {
    buffer()
  }

  function onexitfencedcodefencemeta() {
    resume()
  }

  function onexitfencedcodefencestart() {
    send(tag('>'))
    codeInFlow = true
  }

  function onenterindentedcode() {
    send(tag('<pre><code>'))
    codeInFlow = true
  }

  function onexitflowcode() {
    var previous = last()

    // Send an extra line feed, if the code didn’t end in one.
    if (
      codeInFlow === true &&
      codeSeenData === true &&
      previous !== characters.lineFeed &&
      previous !== characters.carriageReturn
    ) {
      send('\n')
    }

    send(tag('</code></pre>'))
    codeInFlow = false
    codeSeenData = false
    codeSlurpedLineEnding = false
  }

  function onenterlabel() {
    mediaStack.push({label: ''})
    buffer()
  }

  function onexitimagelabelstart() {
    mediaStack[mediaStack.length - 1].type = 'image'
    ignoreTags = true
  }

  function onexitlinklabelstart() {
    mediaStack[mediaStack.length - 1].type = 'link'
  }

  function onexitlabeldata(t, helpers) {
    mediaStack[mediaStack.length - 1].labelId = normalizeIdentifier(
      helpers.sliceSerialize(t)
    )
  }

  function onexitlabel() {
    mediaStack[mediaStack.length - 1].label = resume()
  }

  function onenterreference() {
    mediaStack[mediaStack.length - 1].reference = ''
    buffer()
  }

  function onexitreferencedata(t, helpers) {
    mediaStack[mediaStack.length - 1].referenceId = normalizeIdentifier(
      helpers.sliceSerialize(t)
    )
  }

  function onexitreference() {
    mediaStack[mediaStack.length - 1].reference = resume()
  }

  function onenterresource() {
    mediaStack[mediaStack.length - 1].destination = ''
  }

  function onenterresourcedestination() {
    requiresEncode = false
    buffer()
  }

  function onexitresourcedestination() {
    mediaStack[mediaStack.length - 1].destination = resume()
    requiresEncode = true
  }

  function onenterresourcetitledata() {
    buffer()
  }

  function onexitresourcetitledata() {
    mediaStack[mediaStack.length - 1].title = resume()
  }

  function onexitmedia() {
    var media = mediaStack.pop()
    var context
    var uri
    var title

    context =
      media.destination === undefined
        ? definitions[media.referenceId || media.labelId]
        : media

    ignoreTags = mediaStack.some((d) => d.type === 'image')

    if (context) {
      uri = encode(normalize(context.destination || ''))
      title = context.title

      if (media.type === 'image') {
        send(tag('<img src="' + uri + '" alt="'))
        send(media.label)
        send(tag('"'))
      } else {
        send(tag('<a href="' + uri + '"'))
      }

      send(tag(title === undefined ? '' : ' title="' + title + '"'))

      if (media.type === 'image') {
        send(tag(' />'))
      } else {
        send(tag('>'))
        send(media.label)
        send(tag('</a>'))
      }
    } else {
      send(
        (media.type === 'image' ? '!' : '') +
          '[' +
          media.label +
          ']' +
          (media.reference === undefined
            ? ''
            : '[' + (media.reference || '') + ']')
      )
    }
  }

  function onenterdefinition() {
    mediaStack.push({})
    buffer()
  }

  function onenterdefinitionlabeldata() {
    buffer()
  }

  function onexitdefinitionlabeldata(t, helpers) {
    // Discard plain-text label.
    resume()
    mediaStack[mediaStack.length - 1].labelId = normalizeIdentifier(
      helpers.sliceSerialize(t)
    )
  }

  function onenterdefinitiondestinationdata() {
    requiresEncode = false
    buffer()
  }

  function onexitdefinitiondestinationdata() {
    mediaStack[mediaStack.length - 1].destination = resume()
    requiresEncode = true
  }

  function onenterdefinitiontitledata() {
    buffer()
  }

  function onexitdefinitiontitledata() {
    mediaStack[mediaStack.length - 1].title = resume()
  }

  function onexitdefinition() {
    resume()
    var media = mediaStack.pop()
    var id = media.labelId

    // media.title = resume()

    if (!own.call(definitions, id)) {
      definitions[id] = media
    }

    definitionSlurpLineEnding = true
  }

  function onexitatxheadingstartfence(t, helpers) {
    headingRank = helpers.sliceSerialize(t).length
    send(tag('<h' + headingRank + '>'))
  }

  function onexitatxheading() {
    send(tag('</h' + headingRank + '>'))
    headingRank = undefined
  }

  function onentersetextheading() {
    buffer()
  }

  // Ignore data after content.
  function onexitsetextheadingcontent() {
    buffer()
  }

  function onexitsetextheadingsequence(t, helpers) {
    headingRank = helpers.sliceSerialize(t).charAt(0) === '=' ? 1 : 2
  }

  function onexitsetextheading() {
    resume()
    var data = resume()
    var name = 'h' + headingRank
    send(tag('<' + name + '>'))
    send(data)
    send(tag('</' + name + '>'))
  }

  function onexitdata(t, helpers) {
    send(encode(helpers.sliceSerialize(t)))
  }

  function onexitlineending(t, helpers) {
    if (
      codeInFlow === true &&
      codeSeenData === false &&
      codeSlurpedLineEnding === false
    ) {
      codeSlurpedLineEnding = true
      return
    }

    if (definitionSlurpLineEnding === true) {
      definitionSlurpLineEnding = false
      return
    }

    // Ignore line endings if they end a blank line.
    if (t.blankEnding === true) {
      return
    }

    send(encode(helpers.sliceSerialize(t)))
  }

  function onexitcodelinedata(t, helpers) {
    codeSeenData = true
    send(encode(helpers.sliceSerialize(t)))
  }

  function onexithardbreak() {
    send(tag('<br />'))
  }

  // To do: safe by default?
  function onexithtmlflow(t, helpers) {
    var d = helpers.sliceSerialize(t)
    send(unsafe(d))
  }

  // To do: safe by default?
  function onexithtmlspan(t, helpers) {
    send(unsafe(helpers.sliceSerialize(t).replace(/([\r\n]) +/g, '$1')))
  }

  function onentercode() {
    send(tag('<code>'))
  }

  function onenteremphasis() {
    send(tag('<em>'))
  }

  function onenterstrong() {
    send(tag('<strong>'))
  }

  function onexitcodedata(t, helpers) {
    send(encode(helpers.sliceSerialize(t).replace(/\n/g, ' ')))
  }

  function onexitcode() {
    send(tag('</code>'))
  }

  function onexitemphasis() {
    send(tag('</em>'))
  }

  function onexitstrong() {
    send(tag('</strong>'))
  }

  function onexitthematicbreak() {
    send(tag('<hr />'))
  }

  function onexitcharacterescapecharacter(t, helpers) {
    send(encode(helpers.sliceSerialize(t)))
  }

  function onexitcharacterreferencesequence(t) {
    send(encode(t.value))
  }

  function onexitautolinkuri(t, helpers) {
    var uri = encode(helpers.sliceSerialize(t))
    send(tag('<a href="' + normalize(uri) + '">'))
    send(uri)
    send(tag('</a>'))
  }

  function onexitautolinkemail(t, helpers) {
    var uri = encode(helpers.sliceSerialize(t))
    send(tag('<a href="mailto:' + normalize(uri) + '">'))
    send(uri)
    send(tag('</a>'))
  }

  function tag(value) {
    return ignoreTags === true ? '' : value
  }

  function unsafe(value) {
    /* istanbul ignore next - unsafe/safe toggle. */
    return safe === true ? encode(value) : value
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
