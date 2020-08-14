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
var defaultLineEnding = '\n'

function compileHtml(options) {
  var allowDangerousHtml = (options || {}).allowDangerousHtml
  var tags = true
  var definitions = {}
  var buffers = [[]]
  var head = []
  var body = []
  var events = []
  var mediaStack = []
  var tightStack = []

  var handlers = {
    enter: {
      blockQuote: onenterblockquote,
      codeFenced: onentercodefenced,
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: onentercodeindented,
      codeSpan: onentercodespan,
      content: onentercontent,
      definition: onenterdefinition,
      definitionDestinationString: onenterdefinitiondestinationstring,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: onenteremphasis,
      image: onenterimage,
      label: buffer,
      link: onentermedia,
      listItemMarker: onenterlistitemmarker,
      listItemValue: onenterlistitemvalue,
      listOrdered: onenterlistordered,
      listUnordered: onenterlistunordered,
      paragraph: onenterparagraph,
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
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      codeFenced: onexitflowcode,
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: resume,
      codeFlowValue: onexitcodeflowvalue,
      codeIndented: onexitflowcode,
      codeSpan: onexitcodespan,
      codeSpanValue: onexitcodespanvalue,
      data: onexitdata,
      definition: onexitdefinition,
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: onexitemphasis,
      hardBreakEscape: onexithardbreak,
      hardBreakTrailing: onexithardbreak,
      htmlFlow: onexithtmlflow,
      htmlSpan: onexithtmlspan,
      image: onexitmedia,
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
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: onexitstrong,
      thematicBreak: onexitthematicbreak
    }
  }

  var lineEndingStyle
  var flowCodeInside
  var flowCodeSeenData
  var flowCodeSlurpedLineEnding
  var flowParagraphTightSlurpLineEnding
  var definitionSlurpLineEnding
  var setextHeadingSlurpLineEnding
  var characterReferenceType
  var ignoreEncode
  var media
  var headingRank
  var expectFirstItem
  var lastWasTag

  return compile

  function compile(slice) {
    events = events.concat(slice)
    return slice[slice.length - 1] === codes.eof ? done() : ''
  }

  function done() {
    var length = events.length - 1
    var index = -1
    var start = 0
    var listStack = []
    var handler
    var event

    while (++index < length) {
      event = events[index]

      // We preprocess lists to clean up a couple of line endings, and to infer
      // whether the list is loose or not.
      if (
        event[1].type === types.listOrdered ||
        event[1].type === types.listUnordered
      ) {
        if (event[0] === 'enter') {
          listStack.push(index)
        } else {
          prepareList(events.slice(listStack.pop(index), index))
        }
      }

      // We detect definitions here, and move them to the front.
      if (event[1].type === types.definition) {
        if (event[0] === 'enter') {
          body = body.concat(events.slice(start, index))
          start = index
        } else {
          head = head.concat(events.slice(start, index + 1))
          start = index + 1
        }
      }
    }

    events = head.concat(body, events.slice(start))
    index = -1

    while (++index < length) {
      handler = handlers[events[index][0]]

      if (own.call(handler, events[index][1].type)) {
        handler[events[index][1].type].call(events[index][2], events[index][1])
      }
    }

    return buffers[0].join('')
  }

  function prepareList(events) {
    var length = events.length - 1 // Skip close.
    var index = 0 // Skip open.
    var containerBalance = 0
    var loose = false
    var atMarker
    var event

    while (++index < length) {
      event = events[index]

      if (
        event[1].type === types.listUnordered ||
        event[1].type === types.listOrdered ||
        event[1].type === types.blockQuote
      ) {
        atMarker = false

        if (event[0] === 'enter') {
          containerBalance++
        } else {
          containerBalance--
        }
      } else if (event[1].type === types.listItemPrefix) {
        if (event[0] === 'exit') {
          atMarker = true
        }
      } else if (event[1].type === types.linePrefix) {
        // Ignore
      } else if (event[1].type === types.lineEnding) {
        // Ignore initial line endings.
        if (atMarker) {
          event[1].type = types.lineEndingBlank
          atMarker = false
        }
      } else if (event[1].type === types.lineEndingBlank) {
        if (event[0] === 'enter' && !containerBalance && !atMarker) {
          loose = true
        }
      } else {
        atMarker = false
      }
    }

    events[0][1]._loose = loose
  }

  function buffer() {
    buffers.push([])
  }

  function resume() {
    return buffers.pop().join('')
  }

  function tag(value) {
    if (!tags) return
    lastWasTag = true
    buffers[buffers.length - 1].push(value)
  }

  function raw(value) {
    lastWasTag = undefined
    buffers[buffers.length - 1].push(value)
  }

  function lineEnding() {
    raw(lineEndingStyle || defaultLineEnding)
  }

  function unsafe(value) {
    raw(allowDangerousHtml ? value : encode(value))
  }

  function lineEndingIfNeeded() {
    var buffer = buffers[buffers.length - 1]
    var slice = buffer[buffer.length - 1]
    var previous = slice ? slice.charCodeAt(slice.length - 1) : codes.eof

    if (
      previous === codes.lf ||
      previous === codes.cr ||
      previous === codes.eof
    ) {
      return
    }

    lineEnding()
  }

  function encode(value) {
    return ignoreEncode
      ? value
      : value.replace(characterReferencesExpression, replace)
    function replace(value) {
      return '&' + characterReferences[value] + ';'
    }
  }

  //
  // Handlers.
  //

  function onenterlistordered(token) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ol')
    expectFirstItem = true
  }

  function onenterlistunordered(token) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ul')
    expectFirstItem = true
  }

  function onenterlistitemvalue(token) {
    var value

    if (expectFirstItem) {
      value = parseInt(this.sliceSerialize(token), constants.numericBaseDecimal)

      if (value !== 1) {
        tag(' start="' + encode(String(value)) + '"')
      }
    }
  }

  function onenterlistitemmarker() {
    if (expectFirstItem) {
      tag('>')
    } else {
      onexitlistitem()
    }

    lineEndingIfNeeded()
    tag('<li>')
    // “Hack” to prevent a line ending from showing up if the item is empty.
    lastWasTag = undefined
    expectFirstItem = undefined
  }

  function onexitlistordered() {
    onexitlistitem()
    tightStack.pop()
    lineEnding()
    tag('</ol>')
  }

  function onexitlistunordered() {
    onexitlistitem()
    tightStack.pop()
    lineEnding()
    tag('</ul>')
  }

  function onexitlistitem() {
    if (lastWasTag) lineEndingIfNeeded()
    tag('</li>')
    flowParagraphTightSlurpLineEnding = undefined
  }

  function onenterblockquote() {
    tightStack.push(false)
    lineEndingIfNeeded()
    tag('<blockquote>')
  }

  function onexitblockquote() {
    tightStack.pop()
    lineEndingIfNeeded()
    tag('</blockquote>')
    definitionSlurpLineEnding = undefined
  }

  function onenterparagraph() {
    if (!tightStack[tightStack.length - 1]) {
      lineEndingIfNeeded()
      tag('<p>')
    }

    definitionSlurpLineEnding = undefined
  }

  function onexitparagraph() {
    if (tightStack[tightStack.length - 1]) {
      flowParagraphTightSlurpLineEnding = true
    } else {
      tag('</p>')
    }
  }

  function onentercodefenced() {
    lineEndingIfNeeded()
    tag('<pre><code')
  }

  function onexitcodefencedfenceinfo() {
    var data = resume()
    tag(' class="language-' + data + '"')
  }

  function onexitcodefencedfence() {
    // Exit if this is the closing fence.
    if (flowCodeInside) return
    tag('>')
    flowCodeInside = true
  }

  function onentercodeindented() {
    lineEndingIfNeeded()
    tag('<pre><code>')
    flowCodeInside = true
  }

  function onexitflowcode() {
    // Send an extra line feed, if the code didn’t end in one.
    // If we’ve seen a line ending already, we use that.
    if (flowCodeInside && flowCodeSeenData) lineEndingIfNeeded()
    tag('</code></pre>')
    flowCodeInside = undefined
    flowCodeSeenData = undefined
    flowCodeSlurpedLineEnding = undefined
  }

  function onenterimage(token) {
    onentermedia(token)
    tags = undefined
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
    buffer()
    media.reference = ''
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
    buffer()
    ignoreEncode = true
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
      tag('<img src="' + uri + '" alt="')
      raw(media.label)
      tag('"')
    } else {
      tag('<a href="' + uri + '"')
    }

    tag(title ? ' title="' + title + '"' : '')

    if (media.type === 'image') {
      tag(' />')
    } else {
      tag('>')
      raw(media.label)
      tag('</a>')
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
    buffer()
    ignoreEncode = true
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
    // Exit for further sequences.
    if (headingRank) return
    headingRank = this.sliceSerialize(token).length
    lineEndingIfNeeded()
    tag('<h' + headingRank + '>')
  }

  function onentersetextheading() {
    buffer()
    definitionSlurpLineEnding = undefined
  }

  function onexitsetextheadingtext() {
    setextHeadingSlurpLineEnding = true
  }

  function onexitatxheading() {
    tag('</h' + headingRank + '>')
    headingRank = undefined
  }

  function onexitsetextheadinglinesequence(token) {
    headingRank =
      this.sliceSerialize(token).charCodeAt(0) === codes.equalsTo ? 1 : 2
  }

  function onexitsetextheading() {
    var data = resume()
    lineEndingIfNeeded()
    tag('<h' + headingRank + '>')
    raw(data)
    tag('</h' + headingRank + '>')
    setextHeadingSlurpLineEnding = undefined
    headingRank = undefined
  }

  function onexitdata(token) {
    raw(encode(this.sliceSerialize(token)))
  }

  function onexitlineending(token) {
    // Store line ending style.
    if (!lineEndingStyle) lineEndingStyle = this.sliceSerialize(token)

    if (
      definitionSlurpLineEnding ||
      flowParagraphTightSlurpLineEnding ||
      setextHeadingSlurpLineEnding
    ) {
      return
    }

    if (flowCodeInside && !flowCodeSeenData && !flowCodeSlurpedLineEnding) {
      flowCodeSlurpedLineEnding = true
      return
    }

    raw(encode(this.sliceSerialize(token)))
  }

  function onexitcodeflowvalue(token) {
    raw(encode(this.sliceSerialize(token)))
    flowCodeSeenData = true
  }

  function onexithardbreak() {
    tag('<br />')
  }

  function onexithtmlflow(token) {
    lineEndingIfNeeded()
    unsafe(this.sliceSerialize(token))
  }

  // To do: should lineEnding / linePrefix be separate tokens?
  function onexithtmlspan(token) {
    unsafe(this.sliceSerialize(token).replace(/([\r\n]) +/g, '$1'))
  }

  function onentercodespan() {
    tag('<code>')
  }

  function onenteremphasis() {
    tag('<em>')
  }

  function onenterstrong() {
    tag('<strong>')
  }

  function onexitcodespanvalue(token) {
    raw(encode(this.sliceSerialize(token).replace(/\r?\n|\r/g, ' ')))
  }

  function onexitcodespan() {
    tag('</code>')
  }

  function onexitemphasis() {
    tag('</em>')
  }

  function onexitstrong() {
    tag('</strong>')
  }

  function onexitthematicbreak() {
    lineEndingIfNeeded()
    tag('<hr />')
  }

  function onexitcharacterescapevalue(token) {
    raw(encode(this.sliceSerialize(token)))
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

    raw(encode(value))
    characterReferenceType = undefined
  }

  function onexitautolinkuri(token) {
    var uri = encode(this.sliceSerialize(token))
    tag('<a href="' + normalizeUri(uri) + '">')
    raw(uri)
    tag('</a>')
  }

  function onexitautolinkemail(token) {
    var uri = encode(this.sliceSerialize(token))
    tag('<a href="mailto:' + normalizeUri(uri) + '">')
    raw(uri)
    tag('</a>')
  }
}
