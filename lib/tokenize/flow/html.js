exports.tokenize = tokenizeHtml
exports.resolve = resolveHtml

var basics = require('../../util/html-block-names')
var raws = require('../../util/html-raw-names')
var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiUpperAlpha = require('../../character/group/ascii-upper-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')

var fromCharCode = String.fromCharCode

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '
var exclamationMark = 33 // '!'
var quotationMark = 34 // '"'
var apostrophe = 39 // '''
var dash = 45 // '-'
var dot = 46 // '.'
var slash = 47 // '/'
var colon = 58 // ':'
var lessThan = 60 // '<'
var equalsTo = 61 // '='
var greaterThan = 62 // '>'
var questionMark = 63 // '?'
var leftSquareBracket = 91 // '['
var rightSquareBracket = 93 // ']'
var underscore = 95 // '_'
var graveAccent = 96 // '`'

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

function tokenizeHtml(effects, ok, nok) {
  var kind = 0
  var name = ''
  var endTag
  var lookBuffer
  var lookIndex

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== lessThan) {
      return nok(code)
    }

    effects.enter('html')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === exclamationMark) {
      effects.consume(code)
      return declarationStart
    }

    if (code === slash) {
      endTag = true
      effects.consume(code)
      return tagCloseStart
    }

    if (code === questionMark) {
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
    if (code === dash) {
      kind = 2
      effects.consume(code)
      return commentOpenInside
    }

    if (code === leftSquareBracket) {
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
    if (code === dash) {
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
    var selfClosing = code === slash
    var raw
    var basic

    if (
      code !== code ||
      code === lineFeed ||
      code === space ||
      code === tab ||
      code === greaterThan ||
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

    if (code === dash || asciiAlphanumeric(code)) {
      name += fromCharCode(lowercase(code))
      effects.consume(code)
      return tagName
    }

    return nok(code)
  }

  function basicSelfClosing(code) {
    if (code === greaterThan) {
      effects.consume(code)
      return continuation
    }

    return nok(code)
  }

  function completeAttributeNameBefore(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return completeAttributeNameBefore
    }

    if (endTag === false) {
      if (code === slash) {
        effects.consume(code)
        return completeSelfClosing
      }

      if (code === colon || code === underscore || asciiAlpha(code)) {
        effects.consume(code)
        return completeAttributeName
      }
    }

    if (code === greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    return nok(code)
  }

  function completeAttributeName(code) {
    if (
      code === dash ||
      code === dot ||
      code === colon ||
      code === underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return completeAttributeName
    }

    return completeAttributeNameAfter
  }

  function completeAttributeNameAfter(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return completeAttributeNameAfter
    }

    if (code === equalsTo) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    return completeAttributeNameBefore(code)
  }

  function completeAttributeValueBefore(code) {
    if (
      code !== code ||
      code === lessThan ||
      code === equalsTo ||
      code === greaterThan ||
      code === graveAccent
    ) {
      return nok(code)
    }

    if (code === tab || code === space) {
      effects.consume(code)
      return completeAttributeValueBefore
    }

    if (code === quotationMark) {
      effects.consume(code)
      return completeAttributeValueDoubleQuoted
    }

    if (code === apostrophe) {
      effects.consume(code)
      return completeAttributeValueSingleQuoted
    }

    return completeAttributeValueUnquoted
  }

  function completeAttributeValueDoubleQuoted(code) {
    if (code !== code || code === lineFeed) {
      return nok(code)
    }

    if (code === quotationMark) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueDoubleQuoted
  }

  function completeAttributeValueSingleQuoted(code) {
    if (code !== code || code === lineFeed) {
      return nok(code)
    }

    if (code === apostrophe) {
      effects.consume(code)
      return completeAttributeAfterQuotedValue
    }

    effects.consume(code)
    return completeAttributeValueSingleQuoted
  }

  function completeAttributeValueUnquoted(code) {
    if (
      code !== code ||
      code === tab ||
      code === lineFeed ||
      code === space ||
      code === quotationMark ||
      code === apostrophe ||
      code === lessThan ||
      code === equalsTo ||
      code === greaterThan ||
      code === graveAccent
    ) {
      return completeAttributeNameAfter(code)
    }

    effects.consume(code)
    return completeAttributeValueUnquoted
  }

  function completeAttributeAfterQuotedValue(code) {
    if (
      code === tab ||
      code === space ||
      code === slash ||
      code === greaterThan
    ) {
      return completeAttributeNameBefore
    }

    return nok(code)
  }

  function completeSelfClosing(code) {
    if (code === greaterThan) {
      effects.consume(code)
      return completeAfter
    }

    return nok(code)
  }

  function completeAfter(code) {
    if (code !== code || code === tab || code === lineFeed || code === space) {
      return continuation(code)
    }

    return nok(code)
  }

  function continuation(code) {
    if (code !== code) {
      effects.exit('html')
      return ok(code)
    }

    if (kind === 1 && code === lessThan) {
      effects.consume(code)
      return continuationRawTagOpen
    }

    if (kind === 2 && code === dash) {
      effects.consume(code)
      return continuationCommentInside
    }

    if (kind === 3 && code === questionMark) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    if (kind === 4 && code === greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    if (kind === 5 && code === rightSquareBracket) {
      effects.consume(code)
      return continuationCharacterDataInside
    }

    // 6 and 7 are closed by a blank line.
    if ((kind === 6 || kind === 7) && code === lineFeed) {
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
    if (code === dash) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation
  }

  function continuationRawTagOpen(code) {
    if (code === slash) {
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
    if (code === greaterThan && raws.indexOf(name) !== -1) {
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
    if (code === rightSquareBracket) {
      effects.consume(code)
      return continuationDeclarationInside
    }

    return continuation
  }

  function continuationDeclarationInside(code) {
    if (code === greaterThan) {
      effects.consume(code)
      return continuationClose
    }

    return continuation
  }

  function continuationBlankLineStart(code) {
    if (code === tab || code === space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return continuationBlankLineContinuation
    }

    if (code !== code || code === lineFeed) {
      return ok(code)
    }

    effects.enter('html')
    return continuation
  }

  function continuationBlankLineContinuation(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return continuationBlankLineContinuation
    }

    effects.exit('linePrefix')
    return continuationBlankLineStart(code)
  }

  function continuationClose(code) {
    if (code !== code || code === lineFeed) {
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
