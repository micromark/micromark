import {__generator as tslib__generator} from 'tslib'
import {consume, reconsume, switchContext} from './actions'
import {
  apostrophe,
  asciiControl,
  asciiPunctuation,
  backslash,
  carriageReturn,
  colon,
  eof,
  formFeed,
  greaterThan,
  leftParenthesis,
  leftSquareBracket,
  lessThan,
  lineFeed,
  lineTabulation,
  quotationMark,
  rightParenthesis,
  rightSquareBracket,
  space,
  tab,
  whitespace
} from './characters'
import {ContextHandler, Place, Position, TokenizeType} from './types'
// tslint:disable-next-line:variable-name
export const __generator = tslib__generator

const maxIndentSize = 3
const maxLabelSize = 999
const maxDestinationParensNesting = 3

export interface ContextInfo {
  safePlace: Place
  labelSize: number
  labelNonWhitespace: boolean
  lineEndingBeforeDestination: boolean
  destinationParensNesting: number
  whitespaceBeforeTitle: boolean
  lineEndingBeforeTitle: boolean
  titleMarker?: number
  titleLineIsBlank: boolean
  destinationEnd?: Place
  position: NonNullable<Position>
}

export type StateType =
  | 'START_STATE'
  | 'END_STATE'
  | 'BOGUS_STATE'
  | 'INDENT_STATE'
  | 'LABEL_STATE'
  | 'LABEL_ESCAPE_STATE'
  | 'LABEL_AFTER_STATE'
  | 'DESTINATION_BEFORE_STATE'
  | 'DESTINATION_BRACKETED_STATE'
  | 'DESTINATION_BRACKETED_ESCAPE_STATE'
  | 'DESTINATION_UNBRACKETED_STATE'
  | 'DESTINATION_UNBRACKETED_ESCAPE_STATE'
  | 'TITLE_BEFORE_STATE'
  | 'TITLE_STATE'
  | 'TITLE_ESCAPE_STATE'
  | 'TITLE_AFTER_STATE'
  | 'BOGUS_TITLE_STATE'
  | 'DESTINATION_AFTER_STATE'

const START_STATE = 'START_STATE'
const END_STATE = 'END_STATE'
const BOGUS_STATE = 'BOGUS_STATE'
const INDENT_STATE = 'INDENT_STATE'
const LABEL_STATE = 'LABEL_STATE'
const LABEL_ESCAPE_STATE = 'LABEL_ESCAPE_STATE'
const LABEL_AFTER_STATE = 'LABEL_AFTER_STATE'
const DESTINATION_BEFORE_STATE = 'DESTINATION_BEFORE_STATE'
const DESTINATION_BRACKETED_STATE = 'DESTINATION_BRACKETED_STATE'
const DESTINATION_BRACKETED_ESCAPE_STATE = 'DESTINATION_BRACKETED_ESCAPE_STATE'
const DESTINATION_UNBRACKETED_STATE = 'DESTINATION_UNBRACKETED_STATE'
const DESTINATION_UNBRACKETED_ESCAPE_STATE = 'DESTINATION_UNBRACKETED_ESCAPE_STATE'
const TITLE_BEFORE_STATE = 'TITLE_BEFORE_STATE'
const TITLE_STATE = 'TITLE_STATE'
const TITLE_ESCAPE_STATE = 'TITLE_ESCAPE_STATE'
const TITLE_AFTER_STATE = 'TITLE_AFTER_STATE'
const BOGUS_TITLE_STATE = 'BOGUS_TITLE_STATE'
const DESTINATION_AFTER_STATE = 'DESTINATION_AFTER_STATE'

export const contextHandler: ContextHandler<StateType> = {
  [START_STATE]: startState,
  [END_STATE]: endState,
  [BOGUS_STATE]: bogusState,
  [INDENT_STATE]: indentState,
  [LABEL_STATE]: labelState,
  [LABEL_ESCAPE_STATE]: labelEscapeState,
  [LABEL_AFTER_STATE]: labelAfterState,
  [DESTINATION_BEFORE_STATE]: destinationBeforeState,
  [DESTINATION_BRACKETED_STATE]: destinationBracketedState,
  [DESTINATION_BRACKETED_ESCAPE_STATE]: destinationBracketedEscapeState,
  [DESTINATION_UNBRACKETED_STATE]: destinationUnbracketedState,
  [DESTINATION_UNBRACKETED_ESCAPE_STATE]: destinationUnbracketedEscapeState,
  [TITLE_BEFORE_STATE]: titleBeforeState,
  [TITLE_STATE]: titleState,
  [TITLE_ESCAPE_STATE]: titleEscapeState,
  [TITLE_AFTER_STATE]: titleAfterState,
  [BOGUS_TITLE_STATE]: bogusTitleState,
  [DESTINATION_AFTER_STATE]: destinationAfterState
}

// Link reference definitions.
function* startState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  // Exit immediately if this can’t be a link reference definition.
  switch (code) {
    case space:
    case leftSquareBracket:
      const {line, column, offset, virtualColumn} = tokenizer

      tokenizer.contextInfo = {
        safePlace: {line, column, offset, virtualColumn},
        position: {start: tokenizer.now(), end: tokenizer.now()},
        labelSize: 0,
        labelNonWhitespace: false,
        lineEndingBeforeDestination: false,
        destinationParensNesting: 0,
        whitespaceBeforeTitle: false,
        lineEndingBeforeTitle: false,
        titleMarker: undefined,
        titleLineIsBlank: false
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

  switch (code) {
    case space:
      // Too much indent.
      if (
        contextInfo.position.end &&
        tokenizer.offset - contextInfo.position.end.offset === maxIndentSize
      ) {
        yield reconsume(BOGUS_STATE)
        break
      }

      yield consume()
      break
    case leftSquareBracket:
      yield consume()
      tokenizer.state = LABEL_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* labelState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case eof:
    case leftSquareBracket:
      yield reconsume(BOGUS_STATE)
      break
    case rightSquareBracket:
      if (contextInfo.labelNonWhitespace === false) {
        yield reconsume(BOGUS_STATE)
      } else {
        yield consume()
        tokenizer.state = LABEL_AFTER_STATE
      }
      break
    default:
      if (contextInfo.labelSize > maxLabelSize) {
        yield reconsume(BOGUS_STATE)
      } else {
        contextInfo.labelSize++

        if (contextInfo.labelNonWhitespace === false && !whitespace(code)) {
          contextInfo.labelNonWhitespace = true
        }

        yield consume()

        if (code === backslash) {
          tokenizer.state = LABEL_ESCAPE_STATE
        }
      }

      break
  }
}

function* labelEscapeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  if (asciiPunctuation(code)) {
    if (contextInfo.labelSize > maxLabelSize) {
      yield reconsume(BOGUS_STATE)
    } else {
      contextInfo.labelSize++

      if (contextInfo.labelNonWhitespace === false) {
        contextInfo.labelNonWhitespace = true
      }

      yield consume()
      tokenizer.state = LABEL_STATE
    }
  } else {
    yield reconsume(LABEL_STATE)
  }
}

function* labelAfterState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  switch (code) {
    case colon:
      yield consume()
      tokenizer.state = DESTINATION_BEFORE_STATE
      break
    default:
      yield reconsume(BOGUS_STATE)
      break
  }
}

function* destinationBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case eof:
      yield reconsume(BOGUS_STATE)
      break
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case lineFeed:
    case carriageReturn:
      if (contextInfo.lineEndingBeforeDestination) {
        yield reconsume(BOGUS_STATE)
      } else {
        contextInfo.lineEndingBeforeDestination = true
        yield consume()
      }
      break
    case lessThan:
      yield consume()
      tokenizer.state = DESTINATION_BRACKETED_STATE
      break
    default:
      yield consume()
      tokenizer.state = DESTINATION_UNBRACKETED_STATE
      break
  }
}

function* destinationBracketedState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case eof:
    case lineFeed:
    case carriageReturn:
      yield reconsume(BOGUS_STATE)
      break
    case greaterThan:
      yield consume()

      const {line, column, offset, virtualColumn} = tokenizer
      contextInfo.destinationEnd = {line, column, offset, virtualColumn}

      tokenizer.state = TITLE_BEFORE_STATE

      break
    default:
      yield consume()

      if (code === backslash) {
        tokenizer.state = DESTINATION_BRACKETED_ESCAPE_STATE
      }

      break
  }
}

function* destinationBracketedEscapeState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  if (asciiPunctuation(code)) {
    yield consume()
    tokenizer.state = DESTINATION_BRACKETED_STATE
  } else {
    yield reconsume(DESTINATION_BRACKETED_STATE)
  }
}

function* destinationUnbracketedState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  if (code === null || asciiControl(code) || code === space) {
    const {line, column, offset, virtualColumn} = tokenizer
    contextInfo.destinationEnd = {line, column, offset, virtualColumn}

    yield reconsume(TITLE_BEFORE_STATE)
  } else {
    switch (code) {
      case leftParenthesis:
        if (contextInfo.destinationParensNesting === maxDestinationParensNesting) {
          yield reconsume(BOGUS_STATE)
        } else {
          contextInfo.destinationParensNesting++
          yield consume()
        }
        break
      case rightParenthesis:
        if (contextInfo.destinationParensNesting === 0) {
          yield reconsume(BOGUS_STATE)
        } else {
          contextInfo.destinationParensNesting--
          yield consume()
        }
        break
      default:
        yield consume()

        if (code === backslash) {
          tokenizer.state = DESTINATION_UNBRACKETED_ESCAPE_STATE
        }

        break
    }
  }
}

function* destinationUnbracketedEscapeState(
  tokenizer: TokenizeType<ContextInfo>,
  code: number | null
) {
  if (asciiPunctuation(code)) {
    yield consume()
    tokenizer.state = DESTINATION_UNBRACKETED_STATE
  } else {
    yield reconsume(DESTINATION_UNBRACKETED_STATE)
  }
}

function* titleBeforeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer

  switch (code) {
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      if (contextInfo.whitespaceBeforeTitle === false) {
        contextInfo.whitespaceBeforeTitle = true
      }

      yield consume()
      break
    case lineFeed:
    case carriageReturn:
      if (contextInfo.lineEndingBeforeTitle) {
        yield reconsume(BOGUS_TITLE_STATE)
      } else {
        if (contextInfo.whitespaceBeforeTitle === false) {
          contextInfo.whitespaceBeforeTitle = true
        }

        contextInfo.lineEndingBeforeTitle = true
        yield consume()
      }

      break
    case apostrophe:
    case quotationMark:
    case leftParenthesis:
      if (contextInfo.whitespaceBeforeTitle === false) {
        yield reconsume(BOGUS_TITLE_STATE)
      } else {
        yield consume()
        contextInfo.titleMarker = code === leftParenthesis ? rightParenthesis : code
        tokenizer.state = TITLE_STATE
      }
      break
    default:
      yield reconsume(BOGUS_TITLE_STATE)
      break
  }
}

function* titleState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  const {contextInfo} = tokenizer
  const {titleMarker} = contextInfo

  switch (code) {
    case titleMarker:
      yield consume()
      tokenizer.state = TITLE_AFTER_STATE
      break
    case lineFeed:
    case carriageReturn:
      if (contextInfo.titleLineIsBlank) {
        yield reconsume(BOGUS_TITLE_STATE)
      } else {
        contextInfo.titleLineIsBlank = true
        yield consume()
      }
      break
    default:
      if (titleMarker === rightParenthesis && code === leftParenthesis) {
        yield reconsume(BOGUS_TITLE_STATE)
      } else {
        yield consume()

        if (contextInfo.titleLineIsBlank && code !== space && code !== tab) {
          contextInfo.titleLineIsBlank = false
        }

        if (code === backslash) {
          tokenizer.state = TITLE_ESCAPE_STATE
        }
      }

      break
  }
}

function* titleEscapeState(tokenizer: TokenizeType<ContextInfo>, code: number | null) {
  if (asciiPunctuation(code)) {
    yield consume()
    tokenizer.state = TITLE_STATE
  } else {
    yield reconsume(TITLE_STATE)
  }
}

function* titleAfterState(_: TokenizeType<ContextInfo>, code: number | null) {
  switch (code) {
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case lineFeed:
    case carriageReturn:
      yield reconsume(END_STATE)
      break
    default:
      yield reconsume(BOGUS_TITLE_STATE)
  }
}

function* destinationAfterState(_: TokenizeType<ContextInfo>, code: number | null) {
  switch (code) {
    case tab:
    case space:
    case lineTabulation:
    case formFeed:
      yield consume()
      break
    case lineFeed:
    case carriageReturn:
      yield reconsume(END_STATE)
      break
    default:
      yield reconsume(BOGUS_STATE)
  }
}

function* bogusTitleState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  Object.assign(tokenizer, contextInfo.destinationEnd)

  yield reconsume(DESTINATION_AFTER_STATE)
}

function* bogusState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  yield switchContext(tokenizer.returnContext!)
  tokenizer.state = tokenizer.bogusState!

  // Todo: use the temporary buffer if we start dropping characters.
  Object.assign(tokenizer, contextInfo.safePlace)
}

function* endState(tokenizer: TokenizeType<ContextInfo>) {
  const {contextInfo} = tokenizer

  contextInfo.position.end = tokenizer.now()

  // tslint:disable-next-line:no-console
  console.log('definition:', {
    type: 'definition',
    position: contextInfo.position
  })

  yield consume()
  yield switchContext(tokenizer.returnContext!)
}
