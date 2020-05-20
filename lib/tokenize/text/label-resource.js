exports.tokenize = tokenizeLabelResource
exports.resolveTo = resolveTo

var asciiControl = require('../../character/group/ascii-control')
var core = require('../../core')

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '
var quotationMark = 34 // '"'
var apostrophe = 39 // '''
var leftParenthesis = 40 // '('
var rightParenthesis = 41 // ')'
var lessThan = 60 // '<'
var greaterThan = 62 // '>'
var backslash = 92 // '\'

function resolveTo(events, helpers) {
  var index = events.length - 1
  var destinationEndIndex
  var event
  var token

  // Note: we will always find a link or image, because we don’t tokenize if
  // we’re not after one.
  while (index !== -1) {
    event = events[index]
    token = event[1]

    if (
      event[0] === 'exit' &&
      (token.type === 'link' || token.type === 'image')
    ) {
      break
    }

    if (event[0] === 'exit' && token.type === 'resourceDestination') {
      destinationEndIndex = index
    }

    index--
  }

  var initial = events.slice(0, index)
  var end = events[index]
  var before
  var destination
  var inside
  var after

  if (destinationEndIndex === undefined) {
    before = events.slice(index + 1)
    after = []
    inside = []
  } else {
    before = events.slice(index + 1, destinationEndIndex)
    destination = events[destinationEndIndex][1]
    var slice = events[destinationEndIndex][2].slice(destination)
    after = events.slice(destinationEndIndex)
    var tokenizer = core.plainText(destination.start)
    console.log('s:', [slice], tokenizer)
    inside = [].concat(tokenizer(slice), tokenizer(null))
  }

  console.log('evs:', [slice])
  return initial.concat(before, inside, after, [end])
}

function tokenizeLabelResource(effects, ok, nok) {
  var balance = 0

  return start

  function start(code) {
    var previous

    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== leftParenthesis) return nok(code)

    previous = effects.previousToken

    // Only parse resources when directly after a link or image.
    if (previous.type !== 'image' && previous.type !== 'link') {
      return nok(code)
    }

    effects.enter('resource')
    effects.enter('resourceStartMarker')
    effects.consume(code)
    effects.exit('resourceStartMarker')
    return informationStart
  }

  function informationStart(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return informationStart
    }

    if (code === rightParenthesis) {
      return informationEnd
    }

    if (code === lessThan) {
      effects.enter('resourceDestinationEnclosed')
      effects.enter('resourceDestinationStartMarker')
      effects.consume(code)
      effects.exit('resourceDestinationStartMarker')
      return resourceDestinationEnclosedBefore
    }

    if (code !== code || asciiControl(code)) {
      return nok(code)
    }

    effects.enter('resourceDestination')
    effects.consume(code)
    return resourceDestination
  }

  function resourceDestinationEnclosedBefore(code) {
    if (code !== code || code === lineFeed || code === lessThan) {
      return nok(code)
    }

    if (code === greaterThan) {
      return resourceDestinationEnclosedAfter
    }

    effects.enter('resourceDestination')
    effects.consume(code)
    return resourceDestinationEnclosed
  }

  function resourceDestinationEnclosed(code) {
    if (code !== code || code === lineFeed || code === lessThan) {
      return nok(code)
    }

    if (code === greaterThan) {
      effects.exit('resourceDestination')
      return resourceDestinationEnclosedAfter
    }

    if (code === backslash) {
      effects.consume(code)
      return resourceDestinationEnclosedCharacterEscapeOpen
    }

    effects.consume(code)
    return resourceDestinationEnclosed
  }

  function resourceDestinationEnclosedCharacterEscapeOpen(code) {
    if (code === lessThan || code === greaterThan || code === backslash) {
      effects.consume(code)
    }

    return resourceDestinationEnclosed
  }

  function resourceDestinationEnclosedAfter(code) {
    // Only used for `>`.
    if (code !== greaterThan) {
      return nok(code)
    }

    effects.enter('resourceDestinationEndMarker')
    effects.consume(code)
    effects.exit('resourceDestinationEndMarker')
    effects.exit('resourceDestinationEnclosed')

    return informationBetween
  }

  function resourceDestination(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.exit('resourceDestination')
      return informationBetween
    }

    if (code === leftParenthesis) {
      balance++
      effects.consume(code)
      return resourceDestination
    }

    if (code === rightParenthesis) {
      if (balance === 0) {
        effects.exit('resourceDestination')
        return informationEnd
      }

      balance--
      effects.consume(code)
      return resourceDestination
    }

    if (code === backslash) {
      effects.consume(code)
      return resourceDestinationCharacterEscapeOpen
    }

    if (code !== code || asciiControl(code)) {
      return nok(code)
    }

    effects.consume(code)
    return resourceDestination
  }

  function resourceDestinationCharacterEscapeOpen(code) {
    if (
      code === leftParenthesis ||
      code === rightParenthesis ||
      code === backslash
    ) {
      effects.consume(code)
    }

    return resourceDestination
  }

  function informationBetween(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return informationBetween
    }

    if (
      code === quotationMark ||
      code === apostrophe ||
      code === leftParenthesis
    ) {
      effects.enter('resourceTitle')
      effects.enter('resourceTitleStartMarker')
      effects.consume(code)
      effects.exit('resourceTitleStartMarker')

      return code === quotationMark
        ? titleDoubleQuoted
        : code === apostrophe
        ? titleSingleQuoted
        : titleParenQuoted
    }

    if (code === rightParenthesis) {
      return informationEnd
    }

    return nok(code)
  }

  function titleDoubleQuoted(code) {
    if (code !== code) {
      return nok(code)
    }

    if (code === quotationMark) {
      return titleEnd
    }

    if (code === backslash) {
      effects.consume(code)
      return titleDoubleQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleDoubleQuoted
  }

  function titleDoubleQuotedCharacterEscapeOpen(code) {
    if (code === quotationMark || code === backslash) {
      effects.consume(code)
    }

    return titleDoubleQuoted
  }

  function titleSingleQuoted(code) {
    if (code !== code) {
      return nok(code)
    }

    if (code === apostrophe) {
      return titleEnd
    }

    if (code === backslash) {
      effects.consume(code)
      return titleSingleQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleSingleQuoted
  }

  function titleSingleQuotedCharacterEscapeOpen(code) {
    if (code === apostrophe || code === backslash) {
      effects.consume(code)
    }

    return titleSingleQuoted
  }

  function titleParenQuoted(code) {
    if (code !== code) {
      return nok(code)
    }

    if (code === rightParenthesis) {
      return titleEnd
    }

    if (code === backslash) {
      effects.consume(code)
      return titleParenQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleParenQuoted
  }

  function titleParenQuotedCharacterEscapeOpen(code) {
    if (code === rightParenthesis || code === backslash) {
      effects.consume(code)
    }

    return titleParenQuoted
  }

  // Only used for valid endings.
  function titleEnd(code) {
    effects.enter('resourceTitleEndMarker')
    effects.consume(code)
    effects.exit('resourceTitleEndMarker')
    effects.exit('resourceTitle')
    return titleAfter
  }

  function titleAfter(code) {
    if (code === tab || code === lineFeed || code === space) {
      effects.consume(code)
      return titleAfter
    }

    if (code === rightParenthesis) {
      return informationEnd
    }

    return nok(code)
  }

  function informationEnd(code) {
    if (code !== rightParenthesis) {
      return nok(code)
    }

    effects.enter('resourceEndMarker')
    effects.consume(code)
    effects.exit('resourceEndMarker')
    effects.exit('resource')
    return ok(code)
  }
}
