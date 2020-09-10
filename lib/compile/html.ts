import * as assert from 'assert'
// @ts-ignore
import decode from 'parse-entities/decode-entity'
import * as codes from '../character/codes'
import * as constants from '../constant/constants'
import own from '../constant/has-own-property'
import * as types from '../constant/types'
import normalizeUri from '../util/normalize-uri'
import normalizeIdentifier from '../util/normalize-identifier'
import safeFromInt from '../util/safe-from-int'

var characterReferences = {'"': 'quot', '&': 'amp', '<': 'lt', '>': 'gt'}
var characterReferencesExpression = /["&<>]/g
var protocolHref = /^(https?|ircs?|mailto|xmpp)$/i
var protocolSrc = /^https?$/i

export interface CompileOptions {
  allowDangerousProtocol?: boolean
  defaultLineEnding?: '\n' | '\r\n'
  allowDangerousHtml?: boolean
}

export default function compileHtml(options: CompileOptions) {
  var settings = options || {}
  var tags = true
  var definitions = {}
  var buffers = [[]]
  var head: any = []
  var body: any = []
  var events: any = []
  var mediaStack: any = []
  var tightStack: any = []

  var handlers = {
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
  }

  var lineEndingStyle = settings.defaultLineEnding
  var flowCodeInside: any
  var flowCodeSeenData: any
  var flowCodeSlurpedLineEnding: any
  var flowParagraphTightSlurpLineEnding: any
  var definitionSlurpLineEnding: any
  var setextHeadingSlurpLineEnding: any
  var characterReferenceType: any
  var inCodeText: any
  var ignoreEncode: any
  var media: any
  var headingRank: any
  var expectFirstItem: any
  var lastWasTag: any

  return compile

  function compile(slice: any) {
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
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      handler = handlers[result[index][0]]

      if (own.call(handler, result[index][1].type)) {
        handler[result[index][1].type].call(result[index][2], result[index][1])
      }
    }

    return buffers[0].join('')
  }

  function prepareList(events: any) {
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

  function buffer() {
    buffers.push([])
  }

  function resume() {
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    return buffers.pop().join('')
  }

  function tag(value: any) {
    if (!tags) return
    lastWasTag = true
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    buffers[buffers.length - 1].push(value)
  }

  function raw(value: any) {
    lastWasTag = undefined
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    buffers[buffers.length - 1].push(value)
  }

  function lineEnding() {
    raw(lineEndingStyle || '\n')
  }

  function lineEndingIfNeeded() {
    var buffer = buffers[buffers.length - 1]
    var slice = buffer[buffer.length - 1]
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'charCodeAt' does not exist on type 'neve... Remove this comment to see the full error message
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

  function encode(value: any) {
    return ignoreEncode
      ? value
      : value.replace(characterReferencesExpression, replace)
    function replace(value: any) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      return '&' + characterReferences[value] + ';'
    }
  }

  function url(url: any, protocol: any) {
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

  function onenterlistordered(token: any) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ol')
    expectFirstItem = true
  }

  function onenterlistunordered(token: any) {
    tightStack.push(!token._loose)
    lineEndingIfNeeded()
    tag('<ul')
    expectFirstItem = true
  }

  function onenterlistitemvalue(token: any) {
    var value

    if (expectFirstItem) {
      // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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

  function onenterimage(token: any) {
    onentermedia(token)
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'boolea... Remove this comment to see the full error message
    tags = undefined
  }

  function onentermedia(token: any) {
    media = {type: token.type, label: ''}
    mediaStack.push(media)
  }

  function onexitlabeltext(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    media.labelId = normalizeIdentifier(this.sliceSerialize(token))
  }

  function onexitlabel() {
    media.label = resume()
  }

  function onenterreference() {
    buffer()
    media.reference = ''
  }

  function onexitreferencestring(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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
    var title

    context =
      media.destination === undefined
        ? // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          definitions[media.referenceId || media.labelId]
        : media

    tags = true

    while (index--) {
      if (mediaStack[index].type === 'image') {
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'boolea... Remove this comment to see the full error message
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

  function onexitdefinitionlabelstring(token: any) {
    // Discard label, use the source content instead.
    resume()
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      definitions[id] = media
    }

    mediaStack.pop()
    media = mediaStack[mediaStack.length - 1]
  }

  function onentercontent() {
    definitionSlurpLineEnding = true
  }

  function onexitatxheadingsequence(token: any) {
    // Exit for further sequences.
    if (headingRank) return
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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

  function onexitsetextheadinglinesequence(token: any) {
    headingRank =
      // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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

  function onexitdata(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    raw(encode(this.sliceSerialize(token)))
  }

  function onexitlineending(token: any) {
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

    if (inCodeText) {
      raw(' ')
      return
    }

    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    raw(encode(this.sliceSerialize(token)))
  }

  function onexitcodeflowvalue(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    raw(encode(this.sliceSerialize(token)))
    flowCodeSeenData = true
  }

  function onexithardbreak() {
    tag('<br />')
  }

  function onenterhtmlflow() {
    lineEndingIfNeeded()
    onenterhtml()
  }

  function onexithtml() {
    ignoreEncode = false
  }

  function onenterhtml() {
    if (settings.allowDangerousHtml) {
      ignoreEncode = true
    }
  }

  function onenteremphasis() {
    tag('<em>')
  }

  function onenterstrong() {
    tag('<strong>')
  }

  function onentercodetext() {
    inCodeText = true
    tag('<code>')
  }

  function onexitcodetext() {
    inCodeText = undefined
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

  function onexitcharacterescapevalue(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    raw(encode(this.sliceSerialize(token)))
  }

  function onexitcharacterreferencemarker(token: any) {
    characterReferenceType = token.type
  }

  function onexitcharacterreferencevalue(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
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

  function onexitautolinkprotocol(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    var uri = this.sliceSerialize(token)
    tag('<a href="' + url(uri, protocolHref) + '">')
    raw(encode(uri))
    tag('</a>')
  }

  function onexitautolinkemail(token: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    var uri = this.sliceSerialize(token)
    tag('<a href="' + url('mailto:' + uri, protocolHref) + '">')
    raw(encode(uri))
    tag('</a>')
  }
}
