module.exports = compileHtml

var decode = require('parse-entities/decode-entity')
var codes = require('../character/codes')
var values = require('../character/values')
var constants = require('../constant/constants')
var own = require('../constant/has-own-property')
var types = require('../constant/types')
var normalizeUri = require('../util/normalize-uri')
var normalizeIdentifier = require('../util/normalize-identifier')
var safeFromInt = require('../util/safe-from-int')
var characterReferences = {'"': 'quot', '<': 'lt', '>': 'gt', '&': 'amp'}
var characterReferencesExpression = /["<>&]/g

function compileHtml(options) {
  var allowDangerousHtml = (options || {}).allowDangerousHtml
  var definitions = {}
  var buffers = [[]]
  var mediaStack = []
  var flowCodeInside
  var flowCodeSeenData
  var flowCodeSlurpedLineEnding
  var definitionSlurpLineEnding
  var setextHeadingSlurpLineEnding
  var characterReferenceType
  var ignoreEncode
  var tags = true
  var media
  var headingRank

  var handlers = {
    enter: {
      codeSpan: onentercodespan,
      definition: onenterdefinition,
      definitionDestinationText: onenterdefinitiondestinationtext,
      definitionLabelData: buffer,
      definitionTitleText: buffer,
      emphasis: onenteremphasis,
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeFenced: onentercodefenced,
      codeIndented: onentercodeindented,
      image: onenterimage,
      paragraph: onenterparagraph,
      label: buffer,
      link: onentermedia,
      reference: onenterreference,
      resource: onenterresource,
      resourceDestinationText: onenterresourcedestinationtext,
      resourceTitleText: buffer,
      setextHeading: buffer,
      strong: onenterstrong
    },
    exit: {
      atxHeading: onexitatxheading,
      atxHeadingSequence: onexitatxheadingsequence,
      autolinkEmail: onexitautolinkemail,
      autolinkUri: onexitautolinkuri,
      characterEscapeValue: onexitcharacterescapevalue,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      codeSpan: onexitcodespan,
      codeSpanData: onexitcodespandata,
      codeFlowData: onexitcodeflowdata,
      data: onexitdata,
      definition: onexitdefinition,
      definitionDestinationText: onexitdefinitiondestinationtext,
      definitionLabelData: onexitdefinitionlabeldata,
      definitionTitleText: onexitdefinitiontitletext,
      emphasis: onexitemphasis,
      codeFenced: onexitflowcode,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: resume,
      codeFencedFence: onexitcodefencedfence,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      htmlFlow: onexithtmlflow,
      htmlSpan: onexithtmlspan,
      image: onexitmedia,
      codeIndented: onexitflowcode,
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: onexitmedia,
      paragraph: onexitparagraph,
      reference: onexitreference,
      referenceText: onexitreferencetext,
      resourceDestinationText: onexitresourcedestinationtext,
      resourceTitleText: onexitresourcetitletext,
      setextHeading: onexitsetextheading,
      setextHeadingText: onexitsetextheadingtext,
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      strong: onexitstrong,
      thematicBreak: onexitthematicbreak
    }
  }

  return compile

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
  function compile(events) {
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
        map[token.type].call(event[2], token)
      }
    }

    // istanbul ignore next - we may have buffers open. TODO: test.
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
  // Handlers.
  //

  function onenterparagraph() {
    send(tag('<p>'))
  }

  function onexitparagraph() {
    send(tag('</p>'))
  }

  function onentercodefenced() {
    send(tag('<pre><code'))
  }

  function onexitcodefencedfenceinfo() {
    var data = resume()
    send(tag(' class="language-' + data + '"'))
  }

  function onexitcodefencedfence() {
    // Exit if this is the closing fence.
    if (flowCodeInside) return
    send(tag('>'))
    flowCodeInside = true
  }

  function onentercodeindented() {
    send(tag('<pre><code>'))
    flowCodeInside = true
  }

  function onexitflowcode() {
    var previous = last()

    // Send an extra line feed, if the code didn’t end in one.
    if (
      flowCodeInside &&
      flowCodeSeenData &&
      previous !== codes.lineFeed &&
      previous !== codes.carriageReturn
    ) {
      send(values.lineFeed)
    }

    send(tag('</code></pre>'))
    flowCodeInside = undefined
    flowCodeSeenData = undefined
    flowCodeSlurpedLineEnding = undefined
  }

  function onenterimage(token) {
    tags = undefined
    onentermedia(token)
  }

  function onentermedia(token) {
    media = {type: token.type, label: ''}
    mediaStack.push(media)
  }

  function onexitlabeltext(token) {
    media.labelId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onexitlabel() {
    media.label = resume()
  }

  function onenterreference() {
    media.reference = ''
    buffer()
  }

  function onexitreferencetext(token) {
    media.referenceId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onexitreference() {
    media.reference = resume()
  }

  function onenterresource() {
    media.destination = ''
  }

  function onenterresourcedestinationtext() {
    ignoreEncode = true
    buffer()
  }

  function onexitresourcedestinationtext() {
    media.destination = resume()
    ignoreEncode = undefined
  }

  function onexitresourcetitletext() {
    media.title = resume()
  }

  function onexitmedia() {
    var index = mediaStack.length - 1
    var context
    var uri
    var title

    context =
      media.destination === undefined
        ? definitions[media.referenceId || media.labelId]
        : media

    tags = true

    while (index--) {
      if (mediaStack[index].type === 'image') {
        tags = undefined
        break
      }
    }

    if (context) {
      uri = encode(normalizeUri(context.destination || ''))
      title = context.title

      if (media.type === 'image') {
        send(tag('<img src="' + uri + '" alt="'))
        send(media.label)
        send(tag('"'))
      } else {
        send(tag('<a href="' + uri + '"'))
      }

      send(tag(title ? ' title="' + title + '"' : ''))

      if (media.type === 'image') {
        send(tag(' />'))
      } else {
        send(tag('>'))
        send(media.label)
        send(tag('</a>'))
      }
    } else {
      send(
        (media.type === 'image' ? values.exclamationMark : '') +
          values.leftSquareBracket +
          media.label +
          values.rightSquareBracket +
          (media.reference === undefined
            ? ''
            : values.leftSquareBracket +
              (media.reference || '') +
              values.rightSquareBracket)
      )
    }

    mediaStack.pop()
    media = mediaStack[mediaStack.length - 1]
  }

  function onenterdefinition() {
    buffer()
    media = {}
    mediaStack.push(media)
  }

  function onexitdefinitionlabeldata(token) {
    // Discard plain-text label.
    resume()
    media.labelId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onenterdefinitiondestinationtext() {
    ignoreEncode = true
    buffer()
  }

  function onexitdefinitiondestinationtext() {
    media.destination = resume()
    ignoreEncode = undefined
  }

  function onexitdefinitiontitletext() {
    media.title = resume()
  }

  function onexitdefinition() {
    var id = media.labelId

    resume()

    if (!own.call(definitions, id)) {
      definitions[id] = media
    }

    definitionSlurpLineEnding = true
    mediaStack.pop()
    media = mediaStack[mediaStack.length - 1]
  }

  function onexitatxheadingsequence(token) {
    if (headingRank) return
    headingRank = this.sliceSerialize(token).length
    send(tag('<h' + headingRank + '>'))
  }

  function onexitsetextheadingtext() {
    setextHeadingSlurpLineEnding = true
  }

  function onexitatxheading() {
    send(tag('</h' + headingRank + '>'))
    headingRank = undefined
  }

  function onexitsetextheadinglinesequence(token) {
    headingRank =
      this.sliceSerialize(token).charCodeAt(0) === codes.equalsTo ? 1 : 2
  }

  function onexitsetextheading() {
    var data = resume()
    send(tag('<h' + headingRank + '>'))
    send(data)
    send(tag('</h' + headingRank + '>'))
    headingRank = undefined
  }

  function onexitdata(token) {
    send(encode(this.sliceSerialize(token)))
  }

  function onexitlineending(token) {
    if (flowCodeInside && !flowCodeSeenData && !flowCodeSlurpedLineEnding) {
      flowCodeSlurpedLineEnding = true
      return
    }

    if (setextHeadingSlurpLineEnding) {
      setextHeadingSlurpLineEnding = undefined
      return
    }

    if (definitionSlurpLineEnding) {
      definitionSlurpLineEnding = undefined
      return
    }

    send(encode(this.sliceSerialize(token)))
  }

  function onexitcodeflowdata(token) {
    flowCodeSeenData = true
    send(encode(this.sliceSerialize(token)))
  }

  function onexithardbreak() {
    send(tag('<br />'))
  }

  function onexithtmlflow(token) {
    send(unsafe(this.sliceSerialize(token)))
  }

  // To do: should EOLs / linePrefix be separate tokens?
  function onexithtmlspan(token) {
    send(unsafe(this.sliceSerialize(token).replace(/([\r\n]) +/g, '$1')))
  }

  function onentercodespan() {
    send(tag('<code>'))
  }

  function onenteremphasis() {
    send(tag('<em>'))
  }

  function onenterstrong() {
    send(tag('<strong>'))
  }

  function onexitcodespandata(token) {
    send(encode(this.sliceSerialize(token).replace(/\r?\n|\r/g, values.space)))
  }

  function onexitcodespan() {
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

  function onexitcharacterescapevalue(token) {
    send(encode(this.sliceSerialize(token)))
  }

  function onexitcharacterreferencemarker(token) {
    characterReferenceType = token.type
  }

  function onexitcharacterreferencevalue(token) {
    var data = this.sliceSerialize(token)
    var value

    if (characterReferenceType) {
      value = safeFromInt(
        data,
        characterReferenceType === types.characterReferenceMarkerNumeric
          ? constants.numericBaseDecimal
          : constants.numericBaseHexadecimal
      )
    } else {
      value = decode(data)
    }

    send(encode(value))
    characterReferenceType = undefined
  }

  function onexitautolinkuri(token, prefix) {
    var uri = encode(this.sliceSerialize(token))
    send(tag('<a href="' + (prefix || '') + normalizeUri(uri) + '">'))
    send(uri)
    send(tag('</a>'))
  }

  function onexitautolinkemail(token) {
    onexitautolinkuri.call(this, token, 'mailto:')
  }

  function tag(value) {
    return tags ? value : ''
  }

  function unsafe(value) {
    return allowDangerousHtml ? value : encode(value)
  }

  function encode(value) {
    return ignoreEncode
      ? value
      : value.replace(characterReferencesExpression, replace)
    function replace(value) {
      return values.ampersand + characterReferences[value] + values.semicolon
    }
  }
}
