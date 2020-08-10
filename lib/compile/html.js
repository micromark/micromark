module.exports = compileHtml

var assert = require('assert')
var decode = require('parse-entities/decode-entity')
var codes = require('../character/codes')
var constants = require('../constant/constants')
var own = require('../constant/has-own-property')
var types = require('../constant/types')
var normalizeUri = require('../util/normalize-uri')
var normalizeIdentifier = require('../util/normalize-identifier')
var safeFromInt = require('../util/safe-from-int')
var characterReferences = {'"': 'quot', '&': 'amp', '<': 'lt', '>': 'gt'}
var characterReferencesExpression = /["&<>]/g

function compileHtml(options) {
  var allowDangerousHtml = (options || {}).allowDangerousHtml
  var tags = true
  var definitions = {}
  var buffers = [[]]
  var head = []
  var body = []
  var mediaStack = []
  var lineEndingStyle
  var flowCodeInside
  var flowCodeSeenData
  var flowCodeSlurpedLineEnding
  var definitionSlurpLineEnding
  var setextHeadingSlurpLineEnding
  var characterReferenceType
  var ignoreEncode
  var media
  var headingRank

  var handlers = {
    enter: {
      blockQuote: onenterblockquote,
      codeSpan: onentercodespan,
      definition: onenterdefinition,
      definitionDestinationString: onenterdefinitiondestinationstring,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: onenteremphasis,
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeFenced: onentercodefenced,
      codeIndented: onentercodeindented,
      content: onentercontent,
      image: onenterimage,
      paragraph: onenterparagraph,
      label: buffer,
      link: onentermedia,
      listItem: onenterlistitem,
      listOrdered: onenterlistordered,
      listUnordered: onenterlistunordered,
      reference: onenterreference,
      resource: onenterresource,
      resourceDestinationString: onenterresourcedestinationstring,
      resourceTitleString: buffer,
      setextHeading: onentersetextheading,
      strong: onenterstrong
    },
    exit: {
      atxHeading: onexitatxheading,
      atxHeadingSequence: onexitatxheadingsequence,
      autolinkEmail: onexitautolinkemail,
      autolinkUri: onexitautolinkuri,
      blockQuote: onexitblockquote,
      characterEscapeValue: onexitcharacterescapevalue,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      codeSpan: onexitcodespan,
      codeSpanValue: onexitcodespanvalue,
      codeFlowValue: onexitcodeflowvalue,
      data: onexitdata,
      definition: onexitdefinition,
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
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
      listItem: onexitlistitem,
      listOrdered: onexitlistordered,
      listUnordered: onexitlistunordered,
      paragraph: onexitparagraph,
      reference: onexitreference,
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      setextHeading: onexitsetextheading,
      setextHeadingText: onexitsetextheadingtext,
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      strong: onexitstrong,
      thematicBreak: onexitthematicbreak
    }
  }

  return compile

  function compile(events) {
    var length = events.length
    var index = -1
    var start = 0
    var eof
    var handler

    if (events[length - 1] === codes.eof) {
      eof = true
      length--
    }

    while (++index < length) {
      if (events[index][1].type === 'definition') {
        if (events[index][0] === 'enter') {
          body = body.concat(events.slice(start, index))
          start = index
        } else {
          head = head.concat(events.slice(start, index + 1))
          start = index + 1
        }
      }
    }

    body = body.concat(events.slice(start, length))

    if (!eof) return ''

    events = head.concat(body)
    index = -1

    while (++index < length) {
      handler = handlers[events[index][0]]

      if (own.call(handler, events[index][1].type)) {
        handler[events[index][1].type].call(events[index][2], events[index][1])
      }
    }

    return buffers[0].join('')
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

  function onenterlistordered() {
    send(tag('<ol>'))
    sendLineEnding()
  }

  function onenterlistunordered() {
    send(tag('<ul>'))
    sendLineEnding()
  }

  function onenterlistitem() {
    send(tag('<li>'))
    sendLineEnding()
  }

  function onexitlistordered() {
    var previous = last()

    if (previous !== codes.lf && previous !== codes.cr) {
      sendLineEnding()
    }

    send(tag('</ol>'))

    if (previous === codes.lf || previous === codes.cr) {
      sendLineEnding()
    }
  }

  function onexitlistunordered() {
    var previous = last()

    if (previous !== codes.lf && previous !== codes.cr) {
      sendLineEnding()
    }

    send(tag('</ul>'))

    if (previous === codes.lf || previous === codes.cr) {
      sendLineEnding()
    }
  }

  function onexitlistitem() {
    var previous = last()

    if (previous !== codes.lf && previous !== codes.cr) {
      sendLineEnding()
    }

    send(tag('</li>'))

    if (previous === codes.lf || previous === codes.cr) {
      sendLineEnding()
    }
  }

  function onenterblockquote() {
    send(tag('<blockquote>'))
    sendLineEnding()
  }

  function onexitblockquote() {
    var previous = last()

    if (previous !== codes.lf && previous !== codes.cr) {
      sendLineEnding()
    }

    send(tag('</blockquote>'))

    if (previous === codes.lf || previous === codes.cr) {
      sendLineEnding()
    }
  }

  function onenterparagraph() {
    definitionSlurpLineEnding = undefined
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
    // If we’ve seen a line ending already, we use that.
    if (
      flowCodeInside &&
      flowCodeSeenData &&
      previous !== codes.lf &&
      previous !== codes.cr
    ) {
      sendLineEnding()
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

  function onexitreferencestring(token) {
    media.referenceId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onexitreference() {
    media.reference = resume()
  }

  function onenterresource() {
    media.destination = ''
  }

  function onenterresourcedestinationstring() {
    ignoreEncode = true
    buffer()
  }

  function onexitresourcedestinationstring() {
    media.destination = resume()
    ignoreEncode = undefined
  }

  function onexitresourcetitlestring() {
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

    assert(context, 'expected a context media object to be defined')
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

    mediaStack.pop()
    media = mediaStack[mediaStack.length - 1]
  }

  function onenterdefinition() {
    buffer()
    media = {}
    mediaStack.push(media)
  }

  function onexitdefinitionlabelstring(token) {
    // Discard label, use the source content instead.
    resume()
    media.labelId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onenterdefinitiondestinationstring() {
    ignoreEncode = true
    buffer()
  }

  function onexitdefinitiondestinationstring() {
    media.destination = resume()
    ignoreEncode = undefined
  }

  function onexitdefinitiontitlestring() {
    media.title = resume()
  }

  function onexitdefinition() {
    var id = media.labelId

    resume()

    if (!own.call(definitions, id)) {
      definitions[id] = media
    }

    mediaStack.pop()
    media = mediaStack[mediaStack.length - 1]
  }

  function onentercontent() {
    definitionSlurpLineEnding = true
  }

  function onexitatxheadingsequence(token) {
    if (headingRank) return
    headingRank = this.sliceSerialize(token).length
    send(tag('<h' + headingRank + '>'))
  }

  function onentersetextheading() {
    definitionSlurpLineEnding = undefined
    buffer()
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
    if (!lineEndingStyle) lineEndingStyle = this.sliceSerialize(token)

    if (flowCodeInside && !flowCodeSeenData && !flowCodeSlurpedLineEnding) {
      flowCodeSlurpedLineEnding = true
      return
    }

    if (setextHeadingSlurpLineEnding) {
      setextHeadingSlurpLineEnding = undefined
      return
    }

    if (definitionSlurpLineEnding) {
      return
    }

    send(encode(this.sliceSerialize(token)))
  }

  function onexitcodeflowvalue(token) {
    flowCodeSeenData = true
    send(encode(this.sliceSerialize(token)))
  }

  function onexithardbreak() {
    send(tag('<br />'))
  }

  function onexithtmlflow(token) {
    send(unsafe(this.sliceSerialize(token)))
  }

  // To do: should lineEnding / linePrefix be separate tokens?
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

  function onexitcodespanvalue(token) {
    send(encode(this.sliceSerialize(token).replace(/\r?\n|\r/g, ' ')))
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

  function sendLineEnding() {
    send(lineEndingStyle || '\n')
  }

  function unsafe(value) {
    return allowDangerousHtml ? value : encode(value)
  }

  function encode(value) {
    return ignoreEncode
      ? value
      : value.replace(characterReferencesExpression, replace)
    function replace(value) {
      return '&' + characterReferences[value] + ';'
    }
  }
}