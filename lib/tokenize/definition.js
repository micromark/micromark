exports.tokenize = tokenizeDefinition

var assert = require('assert')
var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var types = require('../constant/types')
var normalizeIdentifier = require('../util/normalize-identifier')
var destinationFactory = require('./factory-destination')
var labelFactory = require('./factory-label')
var spaceFactory = require('./factory-space')
var whitespaceFactory = require('./factory-whitespace')
var titleFactory = require('./factory-title')

var titleConstruct = {tokenize: tokenizeTitle, partial: true}

function tokenizeDefinition(effects, ok, nok) {
  var self = this
  var identifier

  return start

  function start(code) {
    assert(code === codes.leftSquareBracket, 'expected `[`')
    effects.enter(types.definition)
    return labelFactory.call(
      self,
      effects,
      labelAfter,
      nok,
      types.definitionLabel,
      types.definitionLabelMarker,
      types.definitionLabelString
    )(code)
  }

  function labelAfter(code) {
    identifier = normalizeIdentifier(
      self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1)
    )

    if (code === codes.colon) {
      effects.enter(types.definitionMarker)
      effects.consume(code)
      effects.exit(types.definitionMarker)

      // Note: blank lines can’t exist in content.
      return whitespaceFactory(
        effects,
        destinationFactory(
          effects,
          effects.attempt(
            titleConstruct,
            spaceFactory(effects, after, types.whitespace),
            spaceFactory(effects, after, types.whitespace)
          ),
          nok,
          types.definitionDestination,
          types.definitionDestinationLiteral,
          types.definitionDestinationLiteralMarker,
          types.definitionDestinationRaw,
          types.definitionDestinationString
        )
      )
    }

    return nok(code)
  }

  function after(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.definition)

      if (self.parser.defined.indexOf(identifier) < 0) {
        self.parser.defined.push(identifier)
      }

      return ok(code)
    }

    return nok(code)
  }
}

function tokenizeTitle(effects, ok, nok) {
  return start

  function start(code) {
    return markdownLineEndingOrSpace(code)
      ? whitespaceFactory(effects, before)(code)
      : nok(code)
  }

  function before(code) {
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      return titleFactory(
        effects,
        spaceFactory(effects, after, types.whitespace),
        nok,
        types.definitionTitle,
        types.definitionTitleMarker,
        types.definitionTitleString
      )(code)
    }

    return nok(code)
  }

  function after(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}
