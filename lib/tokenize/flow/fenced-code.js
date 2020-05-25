exports.tokenize = tokenizeFencedCode
// exports.resolveTo = resolveToFencedCode

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '
var graveAccent = 96 // '`'
var tilde = 126 // '~'

var min = 3

// function resolveToFencedCode(events) {
//   var index = events.length - 1
//   var prefix
//   var event
//
//   // We’ll always find an enter.
//   while (index !== -1) {
//     event = events[index]
//
//     if (event[0] === 'enter' && event[1].type === 'fencedCode') {
//       break
//     }
//
//     index--
//   }
//
//   if (index - 2 >= 0) {
//     event = events[index - 2]
//
//     if (event[0] === 'enter' && event[1].type === 'linePrefix') {
//       prefix = event
//     }
//   }
//
//   //
//   // !!!!!!!!!!!! Use `previousToken` instead, and do it in the tokenizer?
//   //
//
//   console.log('resolveFencedCode:', prefix, events)
//   return events
// }

function tokenizeFencedCode(effects, ok, nok) {
  var closingFence = {tokenize: tokenizeClosingFence}
  var sizeOpen = 0
  var initialPrefixSize
  var prefixSize
  var marker

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== graveAccent && code !== tilde) {
      return nok(code)
    }

    initialPrefixSize =
      effects.previousToken && effects.previousToken.type === 'linePrefix'
        ? effects.previousToken.end.column - effects.previousToken.start.column
        : 0

    effects.enter('fencedCode')
    effects.enter('fencedCodeFence')
    effects.enter('fencedCodeFenceSequence')

    marker = code

    return sequenceOpen
  }

  function sequenceOpen(code) {
    if (code === marker) {
      sizeOpen++
      effects.consume(code)
      return sequenceOpen
    }

    if (sizeOpen < min) {
      return nok(code)
    }

    effects.exit('fencedCodeFenceSequence')

    if (code !== code || code === lineFeed) {
      return openAfter(code)
    }

    if (code === tab || code === space) {
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenAfter(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return sequenceOpenAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (code !== code || code === lineFeed) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceInfo')
    return sequenceOpenInfo(code)
  }

  function sequenceOpenInfo(code) {
    if (marker === graveAccent && code === marker) {
      return nok(code)
    }

    if (code === tab || code === space) {
      effects.exit('fencedCodeFenceInfo')
      effects.enter('fencedCodeFenceWhitespace')
      return sequenceOpenInfoAfter(code)
    }

    if (code !== code || code === lineFeed) {
      effects.exit('fencedCodeFenceInfo')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenInfo
  }

  function sequenceOpenInfoAfter(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return sequenceOpenInfoAfter
    }

    effects.exit('fencedCodeFenceWhitespace')

    if (code !== code || code === lineFeed) {
      return openAfter(code)
    }

    effects.enter('fencedCodeFenceMeta')
    return sequenceOpenMeta(code)
  }

  function sequenceOpenMeta(code) {
    if (marker === graveAccent && code === marker) {
      return nok(code)
    }

    if (code !== code || code === lineFeed) {
      effects.exit('fencedCodeFenceMeta')
      return openAfter(code)
    }

    effects.consume(code)
    return sequenceOpenMeta
  }

  function openAfter(code) {
    effects.exit('fencedCodeFence')
    return lineEnd(code)
  }

  function lineStart(code) {
    if (code !== code || code === lineFeed) {
      return lineEnd(code)
    }

    if (initialPrefixSize !== 0 && (code === tab || code === space)) {
      effects.enter('linePrefix')
      prefixSize = 0
      return linePrefix(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function linePrefix(code) {
    if (prefixSize < initialPrefixSize && (code === tab || code === space)) {
      // To do: properly calculate tabs.
      prefixSize += code === space ? 1 : 4
      effects.consume(code)
      return linePrefix
    }

    effects.exit('linePrefix')
    prefixSize = undefined

    if (code !== code || code === lineFeed) {
      return lineEnd(code)
    }

    effects.enter('codeLineData')
    return lineData(code)
  }

  function lineData(code) {
    if (code !== code || code === lineFeed) {
      effects.exit('codeLineData')
      return lineEnd(code)
    }

    effects.consume(code)
    return lineData
  }

  function lineEnd(code) {
    if (code !== code) {
      return after(code)
    }

    if (code !== lineFeed) {
      throw new Error('Expected EOL or EOF')
    }

    effects.enter('lineFeed')
    effects.consume(code)
    effects.exit('lineFeed')
    return next(code)
  }

  function next() {
    return effects.createConstructAttempt(closingFence, after, lineStart)
  }

  function after(code) {
    effects.exit('fencedCode')
    return ok(code)
  }

  function tokenizeClosingFence(effects, ok, nok) {
    var size = 0

    return closingStart

    function closingStart(code) {
      if (code === tab || code === space) {
        effects.enter('linePrefix')
        effects.consume(code)
        return closingPrefix
      }

      return closingPrefixAfter(code)
    }

    function closingPrefix(code) {
      // To do: check that prefix isn’t more than 4.
      if (code === tab || code === space) {
        effects.consume(code)
        return closingPrefix
      }

      effects.exit('linePrefix')
      return closingPrefixAfter(code)
    }

    function closingPrefixAfter(code) {
      if (code === marker) {
        effects.enter('fencedCodeFence')
        effects.enter('fencedCodeFenceSequence')
        return closingSequence(code)
      }

      return nok(code)
    }

    function closingSequence(code) {
      if (code === marker) {
        size++
        effects.consume(code)
        return closingSequence
      }

      if (size < sizeOpen) {
        return nok(code)
      }

      effects.exit('fencedCodeFenceSequence')

      if (code === space || code === tab) {
        effects.enter('fencedCodeFenceWhitespace')
        return closingSequenceAfter(code)
      }

      return closingSequenceEnd(code)
    }

    function closingSequenceAfter(code) {
      if (code === tab || code === space) {
        effects.consume(code)
        return closingSequenceAfter
      }

      effects.exit('fencedCodeFenceWhitespace')
      return closingSequenceEnd(code)
    }

    function closingSequenceEnd(code) {
      if (code !== code || code === lineFeed) {
        effects.exit('fencedCodeFence')
        return ok(code)
      }

      return nok(code)
    }
  }
}
