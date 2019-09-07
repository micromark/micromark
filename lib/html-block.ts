import {__generator as tslib__generator} from 'tslib'
import {consume, reconsume, switchContext} from './actions'
import {
  apostrophe,
  carriageReturn,
  colon,
  dash,
  digit0,
  digit9,
  dot,
  eof,
  equalsTo,
  exclamationMark,
  formFeed,
  graveAccent,
  greaterThan,
  leftSquareBracket,
  lessThan,
  lineFeed,
  lineTabulation,
  lowercaseA,
  lowercaseZ,
  questionMark,
  quotationMark,
  slash,
  space,
  tab,
  underscore,
  uppercaseA,
  uppercaseC,
  uppercaseD,
  uppercaseT,
  uppercaseZ
} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxIndentSize = 3
const cdata = [uppercaseC, uppercaseD, uppercaseA, uppercaseT, uppercaseA, leftSquareBracket]

const rawTags = ['script', 'pre', 'style']

const blockTags = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'section',
  'source',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul'
]

interface Token {
  type: string
  value: string
  position: NonNullable<Position>
}

export interface ContextInfo {
  safePlace: Place
  temporaryBuffer: string
  cdataIndex: number
  endTag: boolean
  tagName: string
  kind: number
  tokens: Token[]
  position: NonNullable<Position>
  indent?: Token
}

export type StateType =
  | 'START_STATE'
  | 'END_STATE'
  | 'BOGUS_STATE'
  | 'INDENT_STATE'
  | 'START_TAG_OPEN_STATE'
  | 'START_TAG_NAME_INSIDE_STATE'
  | 'START_TAG_NAME_AFTER_STATE'
  | 'START_SIMPLE_SELF_CLOSING_TAG_STATE'
  | 'START_COMPLETE_ATTRIBUTE_BEFORE_STATE'
  | 'START_COMPLETE_ATTRIBUTE_NAME_INSIDE_STATE'
  | 'START_COMPLETE_ATTRIBUTE_NAME_AFTER_STATE'
  | 'START_COMPLETE_ATTRIBUTE_VALUE_BEFORE_STATE'
  | 'START_COMPLETE_ATTRIBUTE_VALUE_SINGLE_QUOTED_INSIDE_STATE'
  | 'START_COMPLETE_ATTRIBUTE_VALUE_DOUBLE_QUOTED_INSIDE_STATE'
  | 'START_COMPLETE_ATTRIBUTE_VALUE_UNQUOTED_INSIDE_STATE'
  | 'START_COMPLETE_SELF_CLOSING_TAG_STATE'
  | 'START_COMPLETE_TAG_AFTER_STATE'
  | 'START_MARKUP_DECLARATION_OPEN_STATE'
  | 'START_COMMENT_INSIDE_STATE'
  | 'START_CDATA_INSIDE_STATE'
  | 'LINE_INSIDE_STATE'

const START_STATE = 'START_STATE'
const END_STATE = 'END_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const INDENT_STATE = 'INDENT_STATE'
const START_TAG_OPEN_STATE = 'START_TAG_OPEN_STATE'
const START_MARKUP_DECLARATION_OPEN_STATE = 'START_MARKUP_DECLARATION_OPEN_STATE'
const START_COMMENT_INSIDE_STATE = 'START_COMMENT_INSIDE_STATE'
const START_CDATA_INSIDE_STATE = 'START_CDATA_INSIDE_STATE'
const START_TAG_NAME_INSIDE_STATE = 'START_TAG_NAME_INSIDE_STATE'
const START_TAG_NAME_AFTER_STATE = 'START_TAG_NAME_AFTER_STATE'
const START_SIMPLE_SELF_CLOSING_TAG_STATE = 'START_SIMPLE_SELF_CLOSING_TAG_STATE'
const START_COMPLETE_ATTRIBUTE_BEFORE_STATE = 'START_COMPLETE_ATTRIBUTE_BEFORE_STATE'
const START_COMPLETE_ATTRIBUTE_NAME_INSIDE_STATE = 'START_COMPLETE_ATTRIBUTE_NAME_INSIDE_STATE'
const START_COMPLETE_ATTRIBUTE_NAME_AFTER_STATE = 'START_COMPLETE_ATTRIBUTE_NAME_AFTER_STATE'
const START_COMPLETE_ATTRIBUTE_VALUE_BEFORE_STATE = 'START_COMPLETE_ATTRIBUTE_VALUE_BEFORE_STATE'
const START_COMPLETE_ATTRIBUTE_VALUE_SINGLE_QUOTED_INSIDE_STATE =
  'START_COMPLETE_ATTRIBUTE_VALUE_SINGLE_QUOTED_INSIDE_STATE'
const START_COMPLETE_ATTRIBUTE_VALUE_DOUBLE_QUOTED_INSIDE_STATE =
  'START_COMPLETE_ATTRIBUTE_VALUE_DOUBLE_QUOTED_INSIDE_STATE'
const START_COMPLETE_ATTRIBUTE_VALUE_UNQUOTED_INSIDE_STATE =
  'START_COMPLETE_ATTRIBUTE_VALUE_UNQUOTED_INSIDE_STATE'
const START_COMPLETE_SELF_CLOSING_TAG_STATE = 'START_COMPLETE_SELF_CLOSING_TAG_STATE'
const START_COMPLETE_TAG_AFTER_STATE = 'START_COMPLETE_TAG_AFTER_STATE'
const LINE_INSIDE_STATE = 'LINE_INSIDE_STATE'

// Note that `openingSequenceState` is the last state that can go to bogus.
// After it, we’re sure it’s an ATX heading
export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [BOGUS_STATE]: bogusState,
  [INDENT_STATE]: indentState,
  [START_TAG_OPEN_STATE]: startTagOpenState,
  [START_MARKUP_DECLARATION_OPEN_STATE]: startMarkupDeclarationOpenState,
  [START_COMMENT_INSIDE_STATE]: startCommentInsideState,
  [START_CDATA_INSIDE_STATE]: startCdataInsideState,
  [START_TAG_NAME_INSIDE_STATE]: startTagNameInsideState,
  [START_TAG_NAME_AFTER_STATE]: startTagNameAfterState,
  [START_SIMPLE_SELF_CLOSING_TAG_STATE]: startSimpleSelfClosingTagState,
  [START_COMPLETE_ATTRIBUTE_BEFORE_STATE]: startCompleteAttributeBeforeState,
  [START_COMPLETE_ATTRIBUTE_NAME_INSIDE_STATE]: startCompleteAttributeInsideNameState,
  [START_COMPLETE_ATTRIBUTE_NAME_AFTER_STATE]: startCompleteAttributeNameAfterState,
  [START_COMPLETE_ATTRIBUTE_VALUE_BEFORE_STATE]: startCompleteAttributeValueBeforeState,
  [START_COMPLETE_ATTRIBUTE_VALUE_SINGLE_QUOTED_INSIDE_STATE]: startCompleteAttributeValueSingleQuotedInsideState,
  [START_COMPLETE_ATTRIBUTE_VALUE_DOUBLE_QUOTED_INSIDE_STATE]: startCompleteAttributeValueDoubleQuotedInsideState,
  [START_COMPLETE_ATTRIBUTE_VALUE_UNQUOTED_INSIDE_STATE]: startCompleteAttributeValueUnuotedInsideState,
  [START_COMPLETE_SELF_CLOSING_TAG_STATE]: startCompleteSelfClosingTagState,
  [START_COMPLETE_TAG_AFTER_STATE]: startCompleteTagAfterState,
  [LINE_INSIDE_STATE]: lineInsideState
}

// HTML blocks.
function* startState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {line, column, offset, virtualColumn} = tokenizer

  // Exit immediately if this can’t be an HTML block.
  switch (code) {
    case space:
    case lessThan:
      tokenizer.contextInfo = {
        safePlace: {line, column, offset, virtualColumn},
        temporaryBuffer: '',
        cdataIndex: 0,
        endTag: false,
        kind: 0,
        tagName: '',
        tokens: [],
        position: {start: tokenizer.now(), end: tokenizer.now()}
      }

      yield reconsume(INDENT_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* indentState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  let token = contextInfo.indent

  switch (code) {
    case space:
      // Too much indent.
      if (token && tokenizer.offset - token.position.start.offset === maxIndentSize) {
        yield reconsume(BOGUS_STATE)
        break
      }

      start()
      buffer()
      yield consume()
      break
    case lessThan:
      end()
      yield consume()
      tokenizer.state = START_TAG_OPEN_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }

  function start() {
    if (token === undefined) {
      token = {type: 'indent', value: '', position: {start: tokenizer.now()}}
      contextInfo.indent = token
      contextInfo.tokens.push(token)
    }
  }

  function buffer() {
    if (token !== undefined && code !== null) {
      const char = String.fromCharCode(code)
      token.value += char
      contextInfo.temporaryBuffer += char
    }
  }

  function end() {
    if (token !== undefined) {
      token.position.end = tokenizer.now()
      contextInfo.indent = undefined
    }
  }
}

function* startTagOpenState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case exclamationMark:
      yield consume()
      tokenizer.state = START_MARKUP_DECLARATION_OPEN_STATE
      break
    case questionMark:
      yield consume()
      contextInfo.kind = 3
      tokenizer.state = LINE_INSIDE_STATE
      break
    case slash:
      yield consume()
      contextInfo.endTag = true
      tokenizer.state = START_TAG_NAME_INSIDE_STATE
      break
    default:
      if (
        code &&
        ((code >= uppercaseA && code <= uppercaseZ) || (code >= lowercaseA && code <= lowercaseZ))
      ) {
        yield reconsume(START_TAG_NAME_INSIDE_STATE)
      } else {
        yield reconsume(BOGUS_STATE)
      }
      break
  }
}

function* startMarkupDeclarationOpenState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  const {contextInfo} = tokenizer

  switch (code) {
    case dash:
      yield consume()
      tokenizer.state = START_COMMENT_INSIDE_STATE
      break
    case leftSquareBracket:
      yield consume()
      tokenizer.state = START_CDATA_INSIDE_STATE
      break
    default:
      // Note: HTML allows lowercase as well, but CM only supports uppercase.
      if (code && code >= uppercaseA && code <= uppercaseZ) {
        yield consume()
        contextInfo.kind = 4
        tokenizer.state = LINE_INSIDE_STATE
      } else {
        yield reconsume(BOGUS_STATE)
      }
      break
  }
}

function* startCommentInsideState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case dash:
      yield consume()
      contextInfo.kind = 2
      tokenizer.state = LINE_INSIDE_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCdataInsideState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const expected = cdata[contextInfo.cdataIndex]

  switch (code) {
    case expected:
      yield consume()
      contextInfo.cdataIndex++

      // Switch when done:
      if (contextInfo.cdataIndex === cdata.length) {
        contextInfo.kind = 5
        tokenizer.state = LINE_INSIDE_STATE
      }

      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startTagNameInsideState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  if (code) {
    // Lowercase the character.
    if (code >= uppercaseA && code <= uppercaseZ) {
      code += 32
    }

    // https://spec.commonmark.org/0.29/#tag-name
    if (
      (code >= lowercaseA && code <= lowercaseZ) ||
      (code >= digit0 && code <= digit9) ||
      code === dash
    ) {
      contextInfo.tagName += String.fromCharCode(code)
      yield consume()
      return
    }
  }

  yield reconsume(START_TAG_NAME_AFTER_STATE)
}

function* startTagNameAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {tagName, endTag} = contextInfo
  const raw = rawTags.indexOf(tagName) !== -1
  const simple = blockTags.indexOf(tagName) !== -1

  // Raw end tags can never start HTML.
  if (raw && endTag) {
    yield reconsume(BOGUS_STATE)
    return
  }

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      if (raw || simple) {
        contextInfo.kind = raw ? 1 : 6
        yield reconsume(LINE_INSIDE_STATE)
      } else {
        yield reconsume(BOGUS_STATE)
      }
      break
    case greaterThan:
      yield consume()
      if (raw || simple) {
        contextInfo.kind = raw ? 1 : 6
        tokenizer.state = LINE_INSIDE_STATE
      } else {
        contextInfo.kind = 7
        tokenizer.state = START_COMPLETE_TAG_AFTER_STATE
      }
      break
    // White space excluding newlines
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      if (raw || simple) {
        contextInfo.kind = raw ? 1 : 6
        tokenizer.state = LINE_INSIDE_STATE
      } else {
        contextInfo.kind = 7
        tokenizer.state = START_COMPLETE_ATTRIBUTE_BEFORE_STATE
      }
      break
    case slash:
      // Self-closing is not supported for raws and complete end tags.
      if (raw || (endTag && !simple)) {
        yield reconsume(BOGUS_STATE)
      } else {
        yield consume()
        contextInfo.kind = simple ? 6 : 7
        tokenizer.state = simple
          ? START_SIMPLE_SELF_CLOSING_TAG_STATE
          : START_COMPLETE_SELF_CLOSING_TAG_STATE
      }
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCompleteAttributeBeforeState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  const {contextInfo} = tokenizer
  const {endTag} = contextInfo

  if (
    code &&
    (code === underscore ||
      code === colon ||
      (code >= uppercaseA && code <= uppercaseZ) ||
      (code >= lowercaseA && code <= lowercaseZ))
  ) {
    // Attributes are not supported for complete end tags.
    if (endTag) {
      yield reconsume(BOGUS_STATE)
    } else {
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_NAME_INSIDE_STATE
    }

    return
  }

  switch (code) {
    // White space excluding newlines
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case slash:
      // Self-closing solidus is not supported for complete end tags.
      if (endTag) {
        yield reconsume(BOGUS_STATE)
      } else {
        yield consume()
        tokenizer.state = START_COMPLETE_SELF_CLOSING_TAG_STATE
      }
      break
    case greaterThan:
      yield consume()
      tokenizer.state = START_COMPLETE_TAG_AFTER_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCompleteAttributeInsideNameState(_: TokenizeType<ContextInfo>, code: number | null) {
  if (
    code &&
    (code === dot ||
      code === dash ||
      code === underscore ||
      code === colon ||
      (code >= digit0 && code <= digit9) ||
      (code >= uppercaseA && code <= uppercaseZ) ||
      (code >= lowercaseA && code <= lowercaseZ))
  ) {
    yield consume()
  } else {
    yield reconsume(START_COMPLETE_ATTRIBUTE_NAME_AFTER_STATE)
  }
}

function* startCompleteAttributeNameAfterState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  const {contextInfo} = tokenizer
  const {endTag} = contextInfo

  switch (code) {
    // White space excluding newlines
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case equalsTo:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_VALUE_BEFORE_STATE
      break
    case slash:
      // Self-closing solidus is not supported for complete end tags.
      if (endTag) {
        yield reconsume(BOGUS_STATE)
      } else {
        yield consume()
        tokenizer.state = START_COMPLETE_SELF_CLOSING_TAG_STATE
      }
      break
    case greaterThan:
      yield consume()
      tokenizer.state = START_COMPLETE_TAG_AFTER_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCompleteAttributeValueBeforeState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    // White space excluding newlines
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case lessThan:
    case equalsTo:
    case greaterThan:
    case graveAccent:
    case eof:
    case lineFeed:
    case carriageReturn:
      yield reconsume(BOGUS_STATE)
      break
    case apostrophe:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_VALUE_SINGLE_QUOTED_INSIDE_STATE
      break
    case quotationMark:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_VALUE_DOUBLE_QUOTED_INSIDE_STATE
      break
    default:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_VALUE_UNQUOTED_INSIDE_STATE
      break
  }
}

function* startCompleteAttributeValueSingleQuotedInsideState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    case apostrophe:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_BEFORE_STATE
      break
    default:
      yield consume()
      break
  }
}

function* startCompleteAttributeValueDoubleQuotedInsideState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    case quotationMark:
      yield consume()
      tokenizer.state = START_COMPLETE_ATTRIBUTE_BEFORE_STATE
      break
    default:
      yield consume()
      break
  }
}

function* startCompleteAttributeValueUnuotedInsideState(
  _: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    // Markers
    case apostrophe:
    case quotationMark:
    case lessThan:
    case equalsTo:
    case greaterThan:
    case graveAccent:
    // Whitespace
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
    // Newlines
    case eof:
    case lineFeed:
    case carriageReturn:
      yield reconsume(START_COMPLETE_ATTRIBUTE_BEFORE_STATE)
      break
    default:
      yield consume()
      break
  }
}

function* startSimpleSelfClosingTagState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    case greaterThan:
      yield consume()
      tokenizer.state = LINE_INSIDE_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCompleteSelfClosingTagState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  switch (code) {
    case greaterThan:
      yield consume()
      tokenizer.state = START_COMPLETE_TAG_AFTER_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* startCompleteTagAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  switch (code) {
    // Whitespace
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      tokenizer.state = LINE_INSIDE_STATE
      break
    // Newlines
    case eof:
    case lineFeed:
    case carriageReturn:
      yield reconsume(LINE_INSIDE_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* lineInsideState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo, data} = tokenizer
  const {kind} = contextInfo

  // Todo: alternatively we can use different states and prevent double scanning
  // lines.
  switch (code) {
    case eof:
    case carriageReturn:
    case lineFeed:
      const lineBuf = data.slice(contextInfo.safePlace.offset, tokenizer.offset)
      let end = false

      switch (kind) {
        case 1:
          const lower = lineBuf.toLowerCase()

          if (
            lower.includes('</script>') ||
            lower.includes('</pre>') ||
            lower.includes('</style>')
          ) {
            end = true
          }

          break
        case 2:
          if (lineBuf.includes('-->')) {
            end = true
          }
          break
        case 3:
          if (lineBuf.includes('?>')) {
            end = true
          }
          break
        case 4:
          if (lineBuf.includes('>')) {
            end = true
          }
          break
        case 5:
          if (lineBuf.includes(']]>')) {
            end = true
          }
          break
        default:
          const length = lineBuf.length
          let index = -1
          let blank = true
          let char

          while (++index < length) {
            char = lineBuf.charCodeAt(index)
            if (char !== space && char !== tab) {
              blank = false
              break
            }
          }

          if (blank) {
            // Backtrack:
            Object.assign(tokenizer, contextInfo.safePlace)

            end = true
          }

          break
      }

      if (end) {
        yield reconsume(END_STATE)
      } else {
        yield consume()
        const {line, column, offset, virtualColumn} = tokenizer
        contextInfo.safePlace = {line, column, offset, virtualColumn}
        tokenizer.state = LINE_INSIDE_STATE
      }

      break
    default:
      yield consume()
      break
  }
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!

  // Todo: use the temporary buffer if we start dropping characters.
  Object.assign(tokenizer, contextInfo.safePlace)
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo, data} = tokenizer
  const now = tokenizer.now()

  contextInfo.position.end = now

  // tslint:disable-next-line:no-console
  console.log('html block:', {
    type: 'htmlBlock',
    value: data.slice(contextInfo.position.start.offset, now.offset),
    children: contextInfo.tokens,
    position: contextInfo.position
  })

  yield consume()
  yield switchContext(tokenizer.returnContext!)
}
