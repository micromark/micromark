import {resolver as resolveText} from './initialize/text.js'
import {attention} from './tokenize/attention.js'
import {autolink} from './tokenize/autolink.js'
import {blockQuote} from './tokenize/block-quote.js'
import {characterEscape} from './tokenize/character-escape.js'
import {characterReference} from './tokenize/character-reference.js'
import {codeFenced} from './tokenize/code-fenced.js'
import {codeIndented} from './tokenize/code-indented.js'
import {codeText} from './tokenize/code-text.js'
import {definition} from './tokenize/definition.js'
import {hardBreakEscape} from './tokenize/hard-break-escape.js'
import {headingAtx} from './tokenize/heading-atx.js'
import {htmlFlow} from './tokenize/html-flow.js'
import {htmlText} from './tokenize/html-text.js'
import {labelEnd} from './tokenize/label-end.js'
import {labelStartImage} from './tokenize/label-start-image.js'
import {labelStartLink} from './tokenize/label-start-link.js'
import {lineEnding} from './tokenize/line-ending.js'
import {list} from './tokenize/list.js'
import {setextUnderline} from './tokenize/setext-underline.js'
import {thematicBreak} from './tokenize/thematic-break.js'

export var document = {
  42: list, // Asterisk
  43: list, // Plus sign
  45: list, // Dash
  48: list, // 0
  49: list, // 1
  50: list, // 2
  51: list, // 3
  52: list, // 4
  53: list, // 5
  54: list, // 6
  55: list, // 7
  56: list, // 8
  57: list, // 9
  62: blockQuote // Greater than
}

export var contentInitial = {
  91: definition // Left square bracket
}

export var flowInitial = {
  '-2': codeIndented, // Horizontal tab
  '-1': codeIndented, // Virtual space
  32: codeIndented // Space
}

export var flow = {
  35: headingAtx, // Number sign
  42: thematicBreak, // Asterisk
  45: [setextUnderline, thematicBreak], // Dash
  60: htmlFlow, // Less than
  61: setextUnderline, // Equals to
  95: thematicBreak, // Underscore
  96: codeFenced, // Grave accent
  126: codeFenced // Tilde
}

export var string = {
  38: characterReference, // Ampersand
  92: characterEscape // Backslash
}

export var text = {
  '-5': lineEnding, // Carriage return
  '-4': lineEnding, // Line feed
  '-3': lineEnding, // Carriage return + line feed
  33: labelStartImage, // Exclamation mark
  38: characterReference, // Ampersand
  42: attention, // Asterisk
  60: [autolink, htmlText], // Less than
  91: labelStartLink, // Left square bracket
  92: [hardBreakEscape, characterEscape], // Backslash
  93: labelEnd, // Right square bracket
  95: attention, // Underscore
  96: codeText // Grave accent
}

export var insideSpan = {
  null: [attention, resolveText]
}

export var disable = {null: []}
