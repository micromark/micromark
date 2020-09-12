var codes = require('./character/codes')
var attention = require('./tokenize/attention')
var headingAtx = require('./tokenize/heading-atx')
var autolink = require('./tokenize/autolink')
var list = require('./tokenize/list')
var blockQuote = require('./tokenize/block-quote')
var characterEscape = require('./tokenize/character-escape')
var characterReference = require('./tokenize/character-reference')
var codeFenced = require('./tokenize/code-fenced')
var codeIndented = require('./tokenize/code-indented')
var codeText = require('./tokenize/code-text')
var definition = require('./tokenize/definition')
var hardBreakEscape = require('./tokenize/hard-break-escape')
var htmlFlow = require('./tokenize/html-flow')
var htmlText = require('./tokenize/html-text')
var labelEnd = require('./tokenize/label-end')
var labelImage = require('./tokenize/label-start-image')
var labelLink = require('./tokenize/label-start-link')
var setextUnderline = require('./tokenize/setext-underline')
var thematicBreak = require('./tokenize/thematic-break')
var whitespace = require('./tokenize/whitespace')

var document = {}
var contentInitial = {}
var flowInitial = {}
var flow = {}
var string = {}
var text = {}

exports.document = document
exports.contentInitial = contentInitial
exports.flowInitial = flowInitial
exports.flow = flow
exports.string = string
exports.text = text

document[codes.asterisk] = list
document[codes.plusSign] = list
document[codes.dash] = list
document[codes.digit0] = list
document[codes.digit1] = list
document[codes.digit2] = list
document[codes.digit3] = list
document[codes.digit4] = list
document[codes.digit5] = list
document[codes.digit6] = list
document[codes.digit7] = list
document[codes.digit8] = list
document[codes.digit9] = list
document[codes.greaterThan] = blockQuote

contentInitial[codes.leftSquareBracket] = definition

flowInitial[codes.horizontalTab] = codeIndented
flowInitial[codes.virtualSpace] = codeIndented
flowInitial[codes.space] = codeIndented

flow[codes.numberSign] = headingAtx
flow[codes.asterisk] = thematicBreak
flow[codes.dash] = [setextUnderline, thematicBreak]
flow[codes.lessThan] = htmlFlow
flow[codes.equalsTo] = setextUnderline
flow[codes.underscore] = thematicBreak
flow[codes.graveAccent] = codeFenced
flow[codes.tilde] = codeFenced

string[codes.ampersand] = characterReference
string[codes.backslash] = characterEscape

text[codes.carriageReturn] = whitespace
text[codes.lineFeed] = whitespace
text[codes.carriageReturnLineFeed] = whitespace
text[codes.horizontalTab] = whitespace
text[codes.space] = whitespace
text[codes.exclamationMark] = labelImage
text[codes.ampersand] = characterReference
text[codes.asterisk] = attention
text[codes.lessThan] = [autolink, htmlText]
text[codes.leftSquareBracket] = labelLink
text[codes.backslash] = [hardBreakEscape, characterEscape]
text[codes.rightSquareBracket] = labelEnd
text[codes.underscore] = attention
text[codes.graveAccent] = codeText
