import assert from 'assert'
import {codes} from '../character/codes.js'
import {markdownLineEnding} from '../character/markdown-line-ending.js'
import {markdownLineEndingOrSpace} from '../character/markdown-line-ending-or-space.js'
import {types} from '../constant/types.js'
import {normalizeIdentifier} from '../util/normalize-identifier.js'
import {factoryDestination} from './factory-destination.js'
import {factoryLabel} from './factory-label.js'
import {factorySpace} from './factory-space.js'
import {factoryWhitespace} from './factory-whitespace.js'
import {factoryTitle} from './factory-title.js'

export const definition = {name: 'definition', tokenize: tokenizeDefinition}

const titleConstruct = {tokenize: tokenizeTitle, partial: true}

function tokenizeDefinition(effects, ok, nok) {
  const self = this
  let identifier

  return start

  function start(code) {
    assert(code === codes.leftSquareBracket, 'expected `[`')
    effects.enter(types.definition)
    return factoryLabel.call(
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
      return factoryWhitespace(
        effects,
        factoryDestination(
          effects,
          effects.attempt(
            titleConstruct,
            factorySpace(effects, after, types.whitespace),
            factorySpace(effects, after, types.whitespace)
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

      if (!self.parser.defined.includes(identifier)) {
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
      ? factoryWhitespace(effects, before)(code)
      : nok(code)
  }

  function before(code) {
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      return factoryTitle(
        effects,
        factorySpace(effects, after, types.whitespace),
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
