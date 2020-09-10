import * as codes from './character/codes'
import initializeContent from './initialize/content'
import initializeDocument from './initialize/document'
import initializeFlow from './initialize/flow'
import initializeText from './initialize/text'
import attention from './tokenize/attention'
import headingAtx from './tokenize/heading-atx'
import autolink from './tokenize/autolink'
import list from './tokenize/list'
import blockQuote from './tokenize/block-quote'
import characterEscape from './tokenize/character-escape'
import characterReference from './tokenize/character-reference'
import codeFenced from './tokenize/code-fenced'
import codeIndented from './tokenize/code-indented'
import codeText from './tokenize/code-text'
import definition from './tokenize/definition'
import hardBreakEscape from './tokenize/hard-break-escape'
import htmlFlow from './tokenize/html-flow'
import htmlText from './tokenize/html-text'
import labelEnd from './tokenize/label-end'
import labelImage from './tokenize/label-start-image'
import labelLink from './tokenize/label-start-link'
import setextUnderline from './tokenize/setext-underline'
import thematicBreak from './tokenize/thematic-break'
import whitespace from './tokenize/whitespace'

import createTokenizer from './util/create-tokenizer'

export default function createParser() {
  var document = {}
  var contentInitial = {}
  var flowInitial = {}
  var flow = {}
  var string = {}
  var text = {}
  var parser: any

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.asterisk] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.plusSign] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.dash] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit0] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit1] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit2] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit3] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit4] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit5] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit6] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit7] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit8] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.digit9] = list
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  document[codes.greaterThan] = blockQuote

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  contentInitial[codes.leftSquareBracket] = definition

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flowInitial[codes.horizontalTab] = codeIndented
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flowInitial[codes.virtualSpace] = codeIndented
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flowInitial[codes.space] = codeIndented

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.numberSign] = headingAtx
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.asterisk] = thematicBreak
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.dash] = [setextUnderline, thematicBreak]
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.lessThan] = htmlFlow
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.equalsTo] = setextUnderline
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.underscore] = thematicBreak
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.graveAccent] = codeFenced
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  flow[codes.tilde] = codeFenced

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  string[codes.ampersand] = characterReference
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  string[codes.backslash] = characterEscape

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.carriageReturn] = whitespace
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.lineFeed] = whitespace
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.carriageReturnLineFeed] = whitespace
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.horizontalTab] = whitespace
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.space] = whitespace
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.exclamationMark] = labelImage
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.ampersand] = characterReference
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.asterisk] = attention
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.lessThan] = [autolink, htmlText]
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.leftSquareBracket] = labelLink
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.backslash] = [hardBreakEscape, characterEscape]
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.rightSquareBracket] = labelEnd
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.underscore] = attention
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  text[codes.graveAccent] = codeText

  parser = {
    defined: [],
    hooks: {
      contentInitial: contentInitial,
      document: document,
      flowInitial: flowInitial,
      flow: flow,
      string: string,
      text: text
    },
    content: create(initializeContent),
    document: create(initializeDocument),
    flow: create(initializeFlow),
    string: create(initializeText.string),
    text: create(initializeText.text)
  }

  return parser

  function create(initializer: any) {
    return creator
    function creator(from: any) {
      return createTokenizer(parser, initializer, from)
    }
  }
}
