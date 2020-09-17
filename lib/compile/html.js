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
var protocolHref = /^(https?|ircs?|mailto|xmpp)$/i
var protocolSrc = /^https?$/i

function compileHtml(options) {
  var settings = options || {}
  var tags = true
  var definitions = {}
  var buffers = [[]]
  var head = []
  var body = []
  var events = []
  var mediaStack = []
  var tightStack = []

  var handlers = configure(
    {
      enter: {
        blockQuote: onenterblockquote,
        codeFenced: onentercodefenced,
        codeFencedFenceInfo: buffer,
        codeFencedFenceMeta: buffer,
        codeIndented: onentercodeindented,
        codeText: onentercodetext,
        content: onentercontent,
        definition: onenterdefinition,
        definitionDestinationString: onenterdefinitiondestinationstring,
        definitionLabelString: buffer,
        definitionTitleString: buffer,
        emphasis: onenteremphasis,
        htmlFlow: onenterhtmlflow,
        htmlText: onenterhtml,
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
        autolinkProtocol: onexitautolinkprotocol,
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
        codeText: onexitcodetext,
        codeTextData: onexitdata,
        data: onexitdata,
        definition: onexitdefinition,
        definitionDestinationString: onexitdefinitiondestinationstring,
        definitionLabelString: onexitdefinitionlabelstring,
        definitionTitleString: onexitdefinitiontitlestring,
        emphasis: onexitemphasis,
        hardBreakEscape: onexithardbreak,
        hardBreakTrailing: onexithardbreak,
        htmlFlow: onexithtml,
        htmlText: onexithtml,
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
        resource: resume,
        resourceDestinationString: onexitresourcedestinationstring,
        resourceTitleString: onexitresourcetitlestring,
        setextHeading: onexitsetextheading,
        setextHeadingLineSequence: onexitsetextheadinglinesequence,
        setextHeadingText: onexitsetextheadingtext,
        strong: onexitstrong,
        thematicBreak: onexitthematicbreak
      }
    },
    settings.htmlExtensions || []
  )

  var data = {}
  var lineEndingStyle = settings.defaultLineEnding
  var media

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
    var result
    var event

    while (++index < length) {
      event = events[index]

      if (
        !lineEndingStyle &&
        (event[1].type === types.lineEnding ||
          event[1].type === types.lineEndingBlank)
      ) {
        lineEndingStyle = event[2].sliceSerialize(event[1])
      }

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

    result = head.concat(body, events.slice(start, length))
    index = -1

    while (++index < length) {
      handler = handlers[result[index][0]]

      if (own.call(handler, result[index][1].type)) {
        handler[result[index][1].type].call(
          {
            sliceSerialize: result[index][2].sliceSerialize,
            lineEndingIfNeeded: lineEndingIfNeeded,
            options: settings,
            encode: encode,
            raw: raw,
            tag: tag,
            buffer: buffer,
            resume: resume,
            setData: setData,
            getData: getData
          },
          result[index][1]
        )
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
      } else if (event[1].type === types.lineEndingBlank) {
        if (event[0] === 'enter' && !containerBalance) {
          if (atMarker) {
            atMarker = false
          } else {
            loose = true
          }
        }
      } else {
        atMarker = false
      }
    }

    events[0][1]._loose = loose
  }

  function setData(key, value) {
    data[key] = value
  }

  function getData(key) {
    return data[key]
  }

  function buffer() {
    buffers.push([])
  }

  function resume() {
    return buffers.pop().join('')
  }

  function tag(value) {
    if (!tags) return
    setData('lastWasTag', true)
    buffers[buffers.length - 1].push(value)
  }

  function raw(value) {
    setData('lastWasTag')
    buffers[buffers.length - 1].push(value)
  }

  function lineEnding() {
    raw(lineEndingStyle || '\n')
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
    return getData('ignoreEncode')
      ? value
      : value.replace(characterReferencesExpression, replace)
    function replace(value) {
      return '&' + characterReferences[value] + ';'
    }
  }

  function url(url, protocol) {
    var value = encode(normalizeUri(url || ''))
    var colon = value.indexOf(':')
    var questionMark = value.indexOf('?')
    var numberSign = value.indexOf('#')
    var slash = value.indexOf('/')

    if (
      settings.allowDangerousProtocol ||
      // If there is no protocol, it’s relative.
      colon < 0 ||
      // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
      (slash > -1 && colon > slash) ||
      (questionMark > -1 && colon > questionMark) ||
      (numberSign > -1 && colon > numberSign) ||
      // It is a protocol, it should be allowed.
      protocol.test(value.slice(0, colon))
    ) {
      return value
    }

    return ''
  }

  //
  // Handlers.
  //

  function onenterlistordered(token) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ol')
    setData('expectFirstItem', true)
  }

  function onenterlistunordered(token) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ul')
    setData('expectFirstItem', true)
  }

  function onenterlistitemvalue(token) {
    var value

    if (getData('expectFirstItem')) {
      value = parseInt(this.sliceSerialize(token), constants.numericBaseDecimal)

      if (value !== 1) {
        tag(' start="' + encode(String(value)) + '"')
      }
    }
  }

  function onenterlistitemmarker() {
    if (getData('expectFirstItem')) {
      tag('>')
    } else {
      onexitlistitem()
    }

    lineEndingIfNeeded()
    tag('<li>')
    // “Hack” to prevent a line ending from showing up if the item is empty.
    setData('lastWasTag')
    setData('expectFirstItem')
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
    if (getData('lastWasTag') && !getData('slurpAllLineEndings')) {
      lineEndingIfNeeded()
    }

    tag('</li>')
    setData('slurpAllLineEndings')
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
    setData('slurpAllLineEndings')
  }

  function onenterparagraph() {
    if (!tightStack[tightStack.length - 1]) {
      lineEndingIfNeeded()
      tag('<p>')
    }

    setData('slurpAllLineEndings')
  }

  function onexitparagraph() {
    if (tightStack[tightStack.length - 1]) {
      setData('slurpAllLineEndings', true)
    } else {
      tag('</p>')
    }
  }

  function onentercodefenced() {
    lineEndingIfNeeded()
    tag('<pre><code')
  }

  function onexitcodefencedfenceinfo() {
    var value = resume()
    tag(' class="language-' + value + '"')
  }

  function onexitcodefencedfence() {
    // Exit if this is the closing fence.
    if (getData('fencedCodeInside')) return
    tag('>')
    setData('fencedCodeInside', true)
    setData('slurpOneLineEnding', true)
  }

  function onentercodeindented() {
    lineEndingIfNeeded()
    tag('<pre><code>')
  }

  function onexitflowcode() {
    // Send an extra line feed, if we saw data, and the code didn’t end in one.
    if (getData('flowCodeSeenData')) lineEndingIfNeeded()
    tag('</code></pre>')
    setData('fencedCodeInside')
    setData('flowCodeSeenData')
    setData('slurpOneLineEnding')
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
    buffer() // We can have line endings in the resource, ignore them.
    media.destination = ''
  }

  function onenterresourcedestinationstring() {
    buffer()
    setData('ignoreEncode', true)
  }

  function onexitresourcedestinationstring() {
    media.destination = resume()
    setData('ignoreEncode')
  }

  function onexitresourcetitlestring() {
    media.title = resume()
  }

  function onexitmedia() {
    var index = mediaStack.length - 1
    var context
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
    title = context.title

    if (media.type === 'image') {
      tag('<img src="' + url(context.destination, protocolSrc) + '" alt="')
      raw(media.label)
      tag('"')
    } else {
      tag('<a href="' + url(context.destination, protocolHref) + '"')
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
    setData('ignoreEncode', true)
  }

  function onexitdefinitiondestinationstring() {
    media.destination = resume()
    setData('ignoreEncode')
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
    setData('slurpAllLineEndings', true)
  }

  function onexitatxheadingsequence(token) {
    // Exit for further sequences.
    if (getData('headingRank')) return
    setData('headingRank', this.sliceSerialize(token).length)
    lineEndingIfNeeded()
    tag('<h' + getData('headingRank') + '>')
  }

  function onentersetextheading() {
    buffer()
    setData('slurpAllLineEndings')
  }

  function onexitsetextheadingtext() {
    setData('slurpAllLineEndings', true)
  }

  function onexitatxheading() {
    tag('</h' + getData('headingRank') + '>')
    setData('headingRank')
  }

  function onexitsetextheadinglinesequence(token) {
    setData(
      'headingRank',
      this.sliceSerialize(token).charCodeAt(0) === codes.equalsTo ? 1 : 2
    )
  }

  function onexitsetextheading() {
    var value = resume()
    lineEndingIfNeeded()
    tag('<h' + getData('headingRank') + '>')
    raw(value)
    tag('</h' + getData('headingRank') + '>')
    setData('slurpAllLineEndings')
    setData('headingRank')
  }

  function onexitdata(token) {
    raw(encode(this.sliceSerialize(token)))
  }

  function onexitlineending(token) {
    if (getData('slurpAllLineEndings')) {
      return
    }

    if (getData('slurpOneLineEnding')) {
      setData('slurpOneLineEnding')
      return
    }

    if (getData('inCodeText')) {
      raw(' ')
      return
    }

    raw(encode(this.sliceSerialize(token)))
  }

  function onexitcodeflowvalue(token) {
    raw(encode(this.sliceSerialize(token)))
    setData('flowCodeSeenData', true)
  }

  function onexithardbreak() {
    tag('<br />')
  }

  function onenterhtmlflow() {
    lineEndingIfNeeded()
    onenterhtml()
  }

  function onexithtml() {
    setData('ignoreEncode')
  }

  function onenterhtml() {
    if (settings.allowDangerousHtml) {
      setData('ignoreEncode', true)
    }
  }

  function onenteremphasis() {
    tag('<em>')
  }

  function onenterstrong() {
    tag('<strong>')
  }

  function onentercodetext() {
    setData('inCodeText', true)
    tag('<code>')
  }

  function onexitcodetext() {
    setData('inCodeText')
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
    setData('characterReferenceType', token.type)
  }

  function onexitcharacterreferencevalue(token) {
    var value = this.sliceSerialize(token)

    if (getData('characterReferenceType')) {
      value = safeFromInt(
        value,
        getData('characterReferenceType') ===
          types.characterReferenceMarkerNumeric
          ? constants.numericBaseDecimal
          : constants.numericBaseHexadecimal
      )
    } else {
      value = decode(value)
    }

    raw(encode(value))
    setData('characterReferenceType')
  }

  function onexitautolinkprotocol(token) {
    var uri = this.sliceSerialize(token)
    tag('<a href="' + url(uri, protocolHref) + '">')
    raw(encode(uri))
    tag('</a>')
  }

  function onexitautolinkemail(token) {
    var uri = this.sliceSerialize(token)
    tag('<a href="' + url('mailto:' + uri, protocolHref) + '">')
    raw(encode(uri))
    tag('</a>')
  }
}

function configure(handlers, extensions) {
  var length = extensions.length
  var index = -1

  while (++index < length) {
    extension(handlers, extensions[index])
  }

  return handlers
}

function extension(handlers, extension) {
  var hook
  var left
  var right
  var type

  for (hook in extension) {
    left = own.call(handlers, hook) ? handlers[hook] : (handlers[hook] = {})
    right = extension[hook]

    for (type in right) {
      left[type] = right[type]
    }
  }
}
