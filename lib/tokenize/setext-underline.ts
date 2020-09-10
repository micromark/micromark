import type {Effects, Event, NotOkay, Okay, TokenizerThis} from '../types'
import * as codes from '../character/codes'
import markdownLineEnding from '../character/markdown-line-ending'
import * as types from '../constant/types'
import shallow from '../util/shallow'
import createSpaceTokenizer from './partial-space'

export const resolveTo = function resolveToSetextUnderline(
  events: Event[],
  context: unknown
) {
  var index = events.length
  var contentEnter
  var paragraphEnter
  var contentExit
  var definitionExit
  var content
  var token
  var heading

  // Find the opening of the content.
  // It’ll always exist, as we don’t tokenize if it isn’t there.
  while (index--) {
    token = events[index][1]

    if (events[index][0] === 'enter') {
      if (token.type === types.content) {
        content = token
        contentEnter = index
        break
      }

      if (token.type === types.paragraph) {
        paragraphEnter = index
      }
    }
    // Exit
    else {
      if (token.type === types.content) {
        contentExit = index
      }

      if (!definitionExit && token.type === types.definition) {
        definitionExit = index
      }
    }
  }

  heading = {
    type: types.setextHeading,
    start: shallow(events[paragraphEnter][1].start),
    end: shallow(events[events.length - 1][1].end)
  }

  // Change the paragraph to setext heading text.
  events[paragraphEnter][1].type = types.setextHeadingText
  // Add the heading exit at the end.
  events.push(['exit', heading, context])
  // Remove the content end (if needed we’ll add it later)
  events.splice(contentExit, 1)

  // If we have definitions in the content, we’ll keep on having content,
  // but we need move it.
  if (definitionExit) {
    events.splice(paragraphEnter, 0, ['enter', heading, context])
    events.splice(definitionExit + 1, 0, ['exit', content, context])
    content.end = shallow(events[definitionExit][1].end)
  } else {
    events[contentEnter][1] = heading
  }

  return events
}

export const tokenize = function tokenizeSetextUnderline(
  this: TokenizerThis,
  effects: Effects,
  ok: Okay,
  nok: NotOkay
) {
  var self = this
  var marker: number

  return start

  function start(code: number) {
    var index = self.events.length
    var paragraph
    var token

    // Find an opening.
    while (index--) {
      token = self.events[index][1]

      // Skip enter/exit of line ending, line prefix, and content.
      // We can now either have a definition or a paragraph.
      if (
        token.type !== types.lineEnding &&
        token.type !== types.linePrefix &&
        token.type !== types.content
      ) {
        paragraph = token.type === types.paragraph
        break
      }
    }

    if (
      self.lazy ||
      (!paragraph && !self.interrupt) ||
      (code !== codes.dash && code !== codes.equalsTo)
    ) {
      return nok(code)
    }

    effects.enter(types.setextHeadingLine)
    effects.enter(types.setextHeadingLineSequence)
    marker = code
    return closingSequence(code)
  }

  function closingSequence(code: number) {
    if (code === marker) {
      effects.consume(code)
      return closingSequence
    }

    effects.exit(types.setextHeadingLineSequence)
    return effects.attempt(
      createSpaceTokenizer(types.lineSuffix),
      closingSequenceEnd
    )(code)
  }

  function closingSequenceEnd(code: number) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.setextHeadingLine)
      return ok(code)
    }

    return nok(code)
  }
}
