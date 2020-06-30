exports.tokenize = tokenizeHtml
exports.resolve = resolveHtml
exports.resolveTo = resolveToHtml

var characters = require('../../util/characters')
var basics = require('../../util/html-block-names')
var raws = require('../../util/html-raw-names')
var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiUpperAlpha = require('../../character/group/ascii-upper-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')

var fromCharCode = String.fromCharCode

var cdataOpen = 'CDATA['

function resolveHtml(events) {
  var head = events[0]
  var tailIndex = events.length - 1
  var tailToken
  var html

  while (tailIndex !== 0) {
    tailToken = events[tailIndex][1]

    if (tailToken.type !== 'lineFeed' && tailToken.type !== 'linePrefix') {
      break
    }

    tailIndex--
  }

  html = {type: 'html', start: head[1].start, end: events[tailIndex][1].end}

  return [
    ['enter', html, head[2]],
    ['exit', html, head[2]]
  ].concat(events.slice(tailIndex + 1))
}

function resolveToHtml(events) {
  var tailIndex = events.length - 1
  var event

  while (tailIndex !== 0) {
    event = events[tailIndex]

    if (event[0] === 'enter' && event[1].type === 'html') {
      break
    }

    tailIndex--
  }

  event = tailIndex - 2 >= 0 ? events[tailIndex - 2] : null

  if (
    event !== null &&
    event[0] === 'enter' &&
    event[1].type === 'linePrefix'
  ) {
    // Add the prefix start to the HTML token.
    events[tailIndex][1].start = event[1].start
    // Remove the line prefix.
    events.splice(tailIndex - 2, 2)
  }

  return events
}

function tokenizeHtml(effects, ok, nok) {
  var kind = 0
  var name = ''
  var endTag
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.lessThan) {
      return nok(code)
    }

    effects.enter('html')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === characters.exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === characters.slash) {
      endTag = true
      effects.consume(code)
      return tagCloseStart
    }

    if (code === characters.questionMark) {
      kind = 3
      effects.consume(code)
      return continuationDeclarationInside
    }

    if (asciiAlpha(code)) {
      endTag = false
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function declarationStart(code) {
    if (code === characters.dash) {
      kind = 2
      effects.consume(code)
      return commentOpenInside
    }

    if (code === characters.leftSquareBracket) {
      kind = 5
      lookBuffer = cdataOpen
      lookIndex = 0
      effects.consume(code)
      return cdataOpenInside
    }

    if (asciiAlpha(code)) {
      kind = 4
      effects.consume(code)
      return continuationDeclarationInside
    }

    return nok(code)
  }

  function commentOpenInside(code) {
    if (code === characters.dash) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return nok(code)
  }

  function cdataOpenInside(code) {
    if (code === lookBuffer.charCodeAt(lookIndex)) {
      lookIndex++
      effects.consume(code)
      return lookIndex === lookBuffer.length ? continuation : cdataOpenInside
    }

    return nok(code)
  }

  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function tagName(code) {
    var selfClosing = code === characters.slash
    var raw
    var basic

    if (
      code === characters.eof ||
      code === characters.lineFeed ||
      code === characters.space ||
      code === characters.tab ||
      code === characters.greaterThan ||
      selfClosing === true
    ) {
      raw = raws.indexOf(name) !== -1
      basic = basics.indexOf(name) !== -1

      if (raw && endTag === false && selfClosing === false) {
        kind = 1
        return continuation
      }

      if (basic) {
        kind = 6

        if (selfClosing === true) {
          effects.consume(code)
          return basicSelfClosing
        }

        return continuation
      }

      // ❗️ Todo: ignore this check if interrupting content.
      kind = 7
      return completeAttributeNameBefore
    }

    if (code === characters.dash || asciiAlphanumeric(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function basicSelfClosing(code) {
    if (code === characters.greaterThan) {
      effects.consume(code)
      return continuation
    }

    return nok(code)
  }

  function completeAttributeNameBefore(code) {
    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return completeAttributeNameBefore
    }

    if (endTag === false) {
      if (code === characters.slash) {
        effects.consume(code)
        return completeSelfClosing
      }

      if (
        code === characters.colon ||
        code === characters.underscore ||
        asciiAlpha(code)
      ) {
        effects.consume(code)
        return completeAttributeName
      }
    }

    if (code === characters.greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    return nok(code)
  }

  function completeAttributeName(code) {
    if (
      code === characters.dash ||
      code === characters.dot ||
      code === characters.colon ||
      code === characters.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return completeAttributeName
    }

    return completeAttributeNameAfter
  }

  function completeAttributeNameAfter(code) {
    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return completeAttributeNameAfter
    }

    if (code === characters.equalsTo) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    return completeAttributeNameBefore(code)
  }

  function completeAttributeValueBefore(code) {
    if (
      code === characters.eof ||
      code === characters.lessThan ||
      code === characters.equalsTo ||
      code === characters.greaterThan ||
      code === characters.graveAccent
    ) {
      return nok(code)
    }

    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    if (code === characters.quotationMark) {
      effects.consume(code)
      return completeAttributeValueDoubleQuoted
    }

    if (code === characters.apostrophe) {
      effects.consume(code)
      return completeAttributeValueSingleQuoted
    }

    return completeAttributeValueUnquoted
  }

  function completeAttributeValueDoubleQuoted(code) {
    if (code === characters.eof || code === characters.lineFeed) {
      return nok(code)
    }

    if (code === characters.quotationMark) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueDoubleQuoted
  }

  function completeAttributeValueSingleQuoted(code) {
    if (code === characters.eof || code === characters.lineFeed) {
      return nok(code)
    }

    if (code === characters.apostrophe) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueSingleQuoted
  }

  function completeAttributeValueUnquoted(code) {
    if (
      code === characters.eof ||
      code === characters.tab ||
      code === characters.lineFeed ||
      code === characters.space ||
      code === characters.quotationMark ||
      code === characters.apostrophe ||
      code === characters.lessThan ||
      code === characters.equalsTo ||
      code === characters.greaterThan ||
      code === characters.graveAccent
    ) {
      return completeAttributeNameAfter(code)
    }

    effects.consume(code)
    return completeAttributeValueUnquoted
  }

  function completeAttributeAfterQuotedValue(code) {
    if (
      code === characters.tab ||
      code === characters.space ||
      code === characters.slash ||
      code === characters.greaterThan
    ) {
      return completeAttributeNameBefore
    }

    return nok(code)
  }

  function completeSelfClosing(code) {
    if (code === characters.greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    return nok(code)
  }

  function completeAfter(code) {
    if (
      code === characters.eof ||
      code === characters.tab ||
      code === characters.lineFeed ||
      code === characters.space
    ) {
      return continuation(code)
    }

    return nok(code)
  }

  function continuation(code) {
    if (code === characters.eof) {
      effects.exit('html')
      return ok(code)
    }

    if (kind === 1 && code === characters.lessThan) {
      effects.consume(code)
      return continuationRawTagOpen
    }

    if (kind === 2 && code === characters.dash) {
      effects.consume(code)
      return continuationCommentInside
    }

    if (kind === 3 && code === characters.questionMark) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    if (kind === 4 && code === characters.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    if (kind === 5 && code === characters.rightSquareBracket) {
      effects.consume(code)
      return continuationCharacterDataInside
    }

    // 6 and 7 are closed by a blank line.
    if ((kind === 6 || kind === 7) && code === characters.lineFeed) {
      effects.exit('html')
      effects.enter('lineFeed')
      effects.consume(code)
      effects.exit('lineFeed')
      return continuationBlankLineStart
    }

    effects.consume(code)
    return continuation
  }

  function continuationCommentInside(code) {
    if (code === characters.dash) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation
  }

  function continuationRawTagOpen(code) {
    if (code === characters.slash) {
      name = ''
      effects.consume(code)
      return continuationRawEndTag
    }

    return continuation
  }

  // Note: This state can be optimized by either imposing a maximum size (the
  // size of the longest possible raw tag name) or by using a trie of the
  // possible raw tag names.
  function continuationRawEndTag(code) {
    if (code === characters.greaterThan && raws.indexOf(name) !== -1) {
      effects.consume(code)
      return continuationClose
    }

    if (asciiAlpha(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return continuationRawEndTag
    }

    return continuation
  }

  function continuationCharacterDataInside(code) {
    if (code === characters.rightSquareBracket) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation
  }

  function continuationDeclarationInside(code) {
    if (code === characters.greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    return continuation
  }

  function continuationBlankLineStart(code) {
    if (code === characters.tab || code === characters.space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return continuationBlankLineContinuation
    }

    if (code === characters.eof || code === characters.lineFeed) {
      return ok(code)
    }

    effects.enter('html')
    return continuation
  }

  function continuationBlankLineContinuation(code) {
    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return continuationBlankLineContinuation
    }

    effects.exit('linePrefix')
    return continuationBlankLineStart(code)
  }

  function continuationClose(code) {
    if (code === characters.eof || code === characters.lineFeed) {
      effects.exit('html')
      return ok(code)
    }

    effects.consume(code)
    return continuationClose
  }
}

function lowercase(code) {
  return asciiUpperAlpha(code) ? code + 0x20 : code
}
