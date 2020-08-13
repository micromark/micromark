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
  var tightStack = []
  var lineEndingStyle
  var flowCodeInside
  var flowCodeSeenData
  var flowCodeSlurpedLineEnding
  var flowParagraphTightSlurpLineEnding
  var definitionSlurpLineEnding
  var blockquoteSlurpLineEnding
  var setextHeadingSlurpLineEnding
  var characterReferenceType
  var ignoreEncode
  var media
  var headingRank
  var expectFirstItem
  var lastWasTag
  var events = []

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
      listItemValue: onenterlistitemvalue,
      listItemMarker: onenterlistitemmarker,
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

  function compile(slice) {
    events = events.concat(slice)
    return slice[slice.length - 1] === codes.eof ? done() : ''
  }

  function done() {
    var length = events.length - 1
    var listStack = []
    var index = -1
    var start = 0
    var handler
    var event

    while (++index < length) {
      event = events[index]

      if (
        event[1].type === 'listOrdered' ||
        event[1].type === 'listUnordered'
      ) {
        if (event[0] === 'enter') {
          listStack.push(index)
        } else {
          prepareList(events.slice(listStack.pop(index), index))
        }
      }

      if (event[1].type === 'definition') {
        if (event[0] === 'enter') {
          body = body.concat(events.slice(start, index))
          start = index
        } else {
          head = head.concat(events.slice(start, index + 1))
          start = index + 1
        }
      }
    }

    body = body.concat(events.slice(start, length))
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
    return slice ? slice.charCodeAt(slice.length - 1) : codes.eof
  }

  function resume() {
    return buffers.pop().join('')
  }

  function prepareList(events) {
    var index = 0 // Skip open.
    var length = events.length - 1 // Skip close.
    var containerBalance = 0
    var loose = false
    var atMarker
    var event

    while (++index < length) {
      event = events[index]

      if (
        event[1].type === 'listUnordered' ||
        event[1].type === 'listOrdered' ||
        event[1].type === 'blockQuote'
      ) {
        atMarker = false

        if (event[0] === 'enter') {
          containerBalance++
        } else {
          containerBalance--
        }
      } else if (event[1].type === 'listItemPrefix') {
        if (event[0] === 'exit') {
          atMarker = true
        }
      } else if (event[1].type === 'linePrefix') {
        // Ignore
      } else if (event[1].type === 'lineEnding') {
        // Ignore initial line endings.
        if (atMarker) {
          if (event[0] === 'enter') {
            event[1].type = 'lineEndingBlank'
            atMarker = false
          }
        }
      } else if (event[1].type === 'lineEndingBlank') {
        if (event[0] === 'enter' && containerBalance === 0 && !atMarker) {
          loose = true
          break
        }
      } else {
        atMarker = false
      }
    }

    events[0][1]._loose = loose
  }

  //
  // Handlers.
  //

  function onenterlistordered(token) {
    tightStack.push(!token._loose)
    sendLineEndingIfNeeded()
    send(tag('<ol'))
    expectFirstItem = true
  }

  function onenterlistunordered(token) {
    tightStack.push(!token._loose)
    sendLineEndingIfNeeded()
    send(tag('<ul'))
    expectFirstItem = true
  }

  function onenterlistitemvalue(token) {
    var value

    if (expectFirstItem) {
      value = parseInt(this.sliceSerialize(token), constants.numericBaseDecimal)

      if (value !== 1) {
        send(tag(' start="' + encode(String(value)) + '"'))
      }
    }
  }

  function onenterlistitemmarker() {
    if (expectFirstItem) {
      send(tag('>'))
      expectFirstItem = undefined
    } else {
      onexitlistitem()
    }

    sendLineEndingIfNeeded()
    send(tag('<li>'))
    // “Hack” to prevent a line ending from showing up if the item is empty.
    lastWasTag = undefined
  }

  function onexitlistordered() {
    onexitlistitem()
    tightStack.pop()
    sendLineEnding()
    send(tag('</ol>'))
  }

  function onexitlistunordered() {
    onexitlistitem()
    tightStack.pop()
    sendLineEnding()
    send(tag('</ul>'))
  }

  function onexitlistitem() {
    flowParagraphTightSlurpLineEnding = undefined

    if (lastWasTag) {
      sendLineEndingIfNeeded()
    }

    send(tag('</li>'))
  }

  function onenterblockquote() {
    tightStack.push(false)
    sendLineEndingIfNeeded()
    send(tag('<blockquote>'))
  }

  function onexitblockquote() {
    tightStack.pop()
    sendLineEndingIfNeeded()
    send(tag('</blockquote>'))
    definitionSlurpLineEnding = undefined
  }

  function onenterparagraph() {
    var tight = tightStack[tightStack.length - 1]
    definitionSlurpLineEnding = undefined
    if (tight) return
    sendLineEndingIfNeeded()
    send(tag('<p>'))
  }

  function onexitparagraph() {
    var tight = tightStack[tightStack.length - 1]

    if (tight) {
      flowParagraphTightSlurpLineEnding = true
      return
    }

    send(tag('</p>'))
  }

  function onentercodefenced() {
    sendLineEndingIfNeeded()
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
    sendLineEndingIfNeeded()
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
      previous !== codes.eof &&
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
      send(raw(media.label))
      send(tag('"'))
    } else {
      send(tag('<a href="' + uri + '"'))
    }

    send(tag(title ? ' title="' + title + '"' : ''))

    if (media.type === 'image') {
      send(tag(' />'))
    } else {
      send(tag('>'))
      send(raw(media.label))
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
    sendLineEndingIfNeeded()
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
    sendLineEndingIfNeeded()
    send(tag('<h' + headingRank + '>'))
    send(raw(data))
    send(tag('</h' + headingRank + '>'))
    headingRank = undefined
  }

  function onexitdata(token) {
    send(raw(encode(this.sliceSerialize(token))))
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

    if (blockquoteSlurpLineEnding) {
      blockquoteSlurpLineEnding = undefined
      return
    }

    if (flowParagraphTightSlurpLineEnding) {
      flowParagraphTightSlurpLineEnding = undefined
      return
    }

    if (definitionSlurpLineEnding) {
      return
    }

    send(raw(encode(this.sliceSerialize(token))))
  }

  function onexitcodeflowvalue(token) {
    flowCodeSeenData = true
    send(raw(encode(this.sliceSerialize(token))))
  }

  function onexithardbreak() {
    send(tag('<br />'))
  }

  function onexithtmlflow(token) {
    sendLineEndingIfNeeded()
    send(raw(unsafe(this.sliceSerialize(token))))
  }

  // To do: should lineEnding / linePrefix be separate tokens?
  function onexithtmlspan(token) {
    send(raw(unsafe(this.sliceSerialize(token).replace(/([\r\n]) +/g, '$1'))))
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
    send(raw(encode(this.sliceSerialize(token).replace(/\r?\n|\r/g, ' '))))
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
    sendLineEndingIfNeeded()
    send(tag('<hr />'))
  }

  function onexitcharacterescapevalue(token) {
    send(raw(encode(this.sliceSerialize(token))))
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

    send(raw(encode(value)))
    characterReferenceType = undefined
  }

  function onexitautolinkuri(token, prefix) {
    var uri = encode(this.sliceSerialize(token))
    send(tag('<a href="' + (prefix || '') + normalizeUri(uri) + '">'))
    send(raw(uri))
    send(tag('</a>'))
  }

  function onexitautolinkemail(token) {
    onexitautolinkuri.call(this, token, 'mailto:')
  }

  function tag(value) {
    if (!tags) return ''
    lastWasTag = true
    return value
  }

  function raw(value) {
    lastWasTag = undefined
    return value
  }

  function sendLineEndingIfNeeded() {
    var previous = last()

    if (
      previous !== codes.lf &&
      previous !== codes.cr &&
      previous !== codes.eof
    ) {
      sendLineEnding()
    }
  }

  function sendLineEnding() {
    send(raw(lineEndingStyle || '\n'))
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
