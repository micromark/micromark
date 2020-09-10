// This module is compiled away!

// Generic type for data, such as in a title, a destination, etc.
export const data = 'data'

// Generic type for syntactic whitespace (tabs, virtual spaces, spaces).
// Such as, between a fenced code fence and an info string.
export const whitespace = 'whitespace'

// Generic type for line endings (line feed, carriage return, carriage return +
// line feed).
export const lineEnding = 'lineEnding'

// A line ending, but ending a blank line.
export const lineEndingBlank = 'lineEndingBlank'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the start of a
// line.
export const linePrefix = 'linePrefix'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the end of a
// line.
export const lineSuffix = 'lineSuffix'

// Whole ATX heading:
//
// ```markdown
// #
// ## Alpha
// ### Bravo ###
// ```
//
// Includes `atxHeadingSequence`, `whitespace`, `atxHeadingText`.
export const atxHeading = 'atxHeading'

// Sequence of number signs in an ATX heading (`###`).
export const atxHeadingSequence = 'atxHeadingSequence'

// Content in an ATX heading (`alpha`).
// Includes text.
export const atxHeadingText = 'atxHeadingText'

// Whole autolink (`<https://example.com>` or `<admin@example.com>`)
// Includes `autolinkMarker` and `autolinkProtocol` or `autolinkEmail`.
export const autolink = 'autolink'

// Email autolink w/o markers (`admin@example.com`)
export const autolinkEmail = 'autolinkEmail'

// Marker around an `autolinkProtocol` or `autolinkEmail` (`<` or `>`).
export const autolinkMarker = 'autolinkMarker'

// Protocol autolink w/o markers (`https://example.com`)
export const autolinkProtocol = 'autolinkProtocol'

// A whole character escape (`\-`).
// Includes `escapeMarker` and `characterEscapeValue`.
export const characterEscape = 'characterEscape'

// The escaped character (`-`).
export const characterEscapeValue = 'characterEscapeValue'

// A whole character reference (`&amp;`, `&#8800;`, or `&#x1D306;`).
// Includes `characterReferenceMarker`, an optional
// `characterReferenceMarkerNumeric`, in which case an optional
// `characterReferenceMarkerHexadecimal`, and a `characterReferenceValue`.
export const characterReference = 'characterReference'

// The start or end marker (`&` or `;`).
export const characterReferenceMarker = 'characterReferenceMarker'

// Mark reference as numeric (`#`).
export const characterReferenceMarkerNumeric = 'characterReferenceMarkerNumeric'

// Mark reference as numeric (`x` or `X`).
export const characterReferenceMarkerHexadecimal =
  'characterReferenceMarkerHexadecimal'

// Value of character reference w/o markers (`amp`, `8800`, or `1D306`).
export const characterReferenceValue = 'characterReferenceValue'

// Whole fenced code:
//
// ````markdown
// ```js
// alert(1)
// ```
// ````
export const codeFenced = 'codeFenced'

// A fenced code fence, including whitespace, sequence, info, and meta
// (` ```js `).
export const codeFencedFence = 'codeFencedFence'

// Sequence of grave accent or tilde characters (` ``` `) in a fence.
export const codeFencedFenceSequence = 'codeFencedFenceSequence'

// Info word (`js`) in a fence.
// Includes string.
export const codeFencedFenceInfo = 'codeFencedFenceInfo'

// Meta words (`highlight="1"`) in a fence.
// Includes string.
export const codeFencedFenceMeta = 'codeFencedFenceMeta'

// A line of code.
export const codeFlowValue = 'codeFlowValue'

// Whole indented code:
//
// ```markdown
//     alert(1)
// ```
//
// Includes `lineEnding`, `linePrefix`, and `codeFlowValue`.
export const codeIndented = 'codeIndented'

// A text code (``` `alpha` ```).
// Includes `codeTextSequence`, `data`, `lineEnding`, and can include
// `codeTextPaddingWhitespace` and `codeTextPaddingLineEnding`.
export const codeText = 'codeText'

// A space right after or before a tick.
export const codeTextPaddingWhitespace = 'codeTextPaddingWhitespace'

// A line ending right after or before a tick.
export const codeTextPaddingLineEnding = 'codeTextPaddingLineEnding'

// A text code fence (` `` `).
export const codeTextSequence = 'codeTextSequence'

// Whole content:
//
// ```markdown
// [a]: b
// c
// =
// d
// ```
//
// Includes `paragraph` and `definition`.
export const content = 'content'
// Whole definition:
//
// ```markdown
// [micromark]: https://github.com/micromark/micromark
// ```
//
// Includes `definitionLabel`, `definitionMarker`, `whitespace`,
// `definitionDestination`, and optionally `lineEnding` and `definitionTitle`.
export const definition = 'definition'

// Destination of a definition (`https://github.com/micromark/micromark` or
// `<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationLiteral` or `definitionDestinationRaw`.
export const definitionDestination = 'definitionDestination'

// Enclosed destination of a definition
// (`<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationMarker` and optionally
// `definitionDestinationString`.
export const definitionDestinationLiteral = 'definitionDestinationLiteral'

// Markers of an enclosed definition destination (`<` or `>`).
export const definitionDestinationMarker = 'definitionDestinationMarker'

// Unenclosed destination of a definition
// (`https://github.com/micromark/micromark`).
// Includes `definitionDestinationString`.
export const definitionDestinationRaw = 'definitionDestinationRaw'

// Text in an destination (`https://github.com/micromark/micromark`).
// Includes string.
export const definitionDestinationString = 'definitionDestinationString'

// Label of a definition (`[micromark]`).
// Includes `definitionLabelMarker` and `definitionLabelString`.
export const definitionLabel = 'definitionLabel'

// Markers of a definition label (`[` or `]`).
export const definitionLabelMarker = 'definitionLabelMarker'

// Value of a definition label (`micromark`).
// Includes string.
export const definitionLabelString = 'definitionLabelString'

// Marker between a label and a destination (`:`).
export const definitionMarker = 'definitionMarker'

// Title of a definition (`"x"`, `'y'`, or `(z)`).
// Includes `definitionTitleMarker` and optionally `definitionTitleString`.
export const definitionTitle = 'definitionTitle'

// Marker around a title of a definition (`"`, `'`, `(`, or `)`).
export const definitionTitleMarker = 'definitionTitleMarker'

// Data without markers in a title (`z`).
// Includes string.
export const definitionTitleString = 'definitionTitleString'

// Emphasis (`*alpha*`).
// Includes `emphasisSequence` and `emphasisText`.
export const emphasis = 'emphasis'

// Sequence of emphasis markers (`*` or `_`).
export const emphasisSequence = 'emphasisSequence'

// Emphasis text (`alpha`).
// Includes text.
export const emphasisText = 'emphasisText'

// The character escape marker (`\`).
export const escapeMarker = 'escapeMarker'

// A hard break created with a backslash (`\\n`).
// Includes `escapeMarker` (does not include the line ending)
export const hardBreakEscape = 'hardBreakEscape'

// A hard break created with trailing whitespace (`  \n`).
// Includes `whitespace` (does not include the line ending)
export const hardBreakTrailing = 'hardBreakTrailing'

// Flow HTML:
//
// ```markdown
// <div
// ```
//
// Inlcudes `lineEnding`, `data`.
export const htmlFlow = 'htmlFlow'

// HTML in text (the tag in `a <i> b`).
// Includes `lineEnding`, `data`.
export const htmlText = 'htmlText'

// Whole image (`![alpha](bravo)`, `![alpha][bravo]`, `![alpha][]`, or
// `![alpha]`).
// Includes `label` and an optional `resource` or `reference`.
export const image = 'image'

// Whole link label (`[*alpha*]`).
// Includes `labelLink` or `labelImage`, `labelText`, and `labelEnd`.
export const label = 'label'

// Text in an label (`*alpha*`).
// Includes text.
export const labelText = 'labelText'

// Start a link label (`[`).
// Includes a `labelMarker`.
export const labelLink = 'labelLink'

// Start an image label (`![`).
// Includes `labelImageMarker` and `labelMarker`.
export const labelImage = 'labelImage'

// Marker of a label (`[` or `]`).
export const labelMarker = 'labelMarker'

// Marker to start an image (`!`).
export const labelImageMarker = 'labelImageMarker'

// End a label (`]`).
// Includes `labelMarker`.
export const labelEnd = 'labelEnd'

// Whole link (`[alpha](bravo)`, `[alpha][bravo]`, `[alpha][]`, or `[alpha]`).
// Includes `label` and an optional `resource` or `reference`.
export const link = 'link'

// Whole paragraph:
//
// ```markdown
// alpha
// bravo.
// ```
//
// Includes text.
export const paragraph = 'paragraph'

// A reference (`[alpha]` or `[]`).
// Includes `referenceMarker` and an optional `referenceString`.
export const reference = 'reference'

// A reference marker (`[` or `]`).
export const referenceMarker = 'referenceMarker'

// Reference text (`alpha`).
// Includes string.
export const referenceString = 'referenceString'

// A resource (`(https://example.com "alpha")`).
// Includes `resourceMarker`, an optional `resourceDestination` with an optional
// `whitespace` and `resourceTitle`.
export const resource = 'resource'

// A resource destination (`https://example.com`).
// Includes `resourceDestinationLiteral` or `resourceDestinationRaw`.
export const resourceDestination = 'resourceDestination'

// A literal resource destination (`<https://example.com>`).
// Includes `resourceDestinationLiteralMarker` and optionally
// `resourceDestinationString`.
export const resourceDestinationLiteral = 'resourceDestinationLiteral'

// A resource destination marker (`<` or `>`).
export const resourceDestinationLiteralMarker = 'resourceDestinationLiteralMarker'

// A raw resource destination (`https://example.com`).
// Includes `resourceDestinationString`.
export const resourceDestinationRaw = 'resourceDestinationRaw'

// Resource destination text (`https://example.com`).
// Includes string.
export const resourceDestinationString = 'resourceDestinationString'

// A resource marker (`(` or `)`).
export const resourceMarker = 'resourceMarker'

// A resource title (`"alpha"`, `'alpha'`, or `(alpha)`).
// Includes `resourceTitleMarker` and optionally `resourceTitleString`.
export const resourceTitle = 'resourceTitle'

// A resource title marker (`"`, `'`, `(`, or `)`).
export const resourceTitleMarker = 'resourceTitleMarker'

// Resource destination title (`alpha`).
// Includes string.
export const resourceTitleString = 'resourceTitleString'

// Whole setext heading:
//
// ```markdown
// alpha
// bravo
// =====
// ```
//
// Includes `setextHeadingText`, `lineEnding`, `linePrefix`, and
// `setextHeadingLine`.
export const setextHeading = 'setextHeading'

// Content in a setext heading (`alpha\nbravo`).
// Includes text.
export const setextHeadingText = 'setextHeadingText'

// Underline in a setext heading, including whitespace suffix (`==`).
// Includes `setextHeadingLineSequence`.
export const setextHeadingLine = 'setextHeadingLine'

// Sequence of equals or dash characters in underline in a setext heading (`-`).
export const setextHeadingLineSequence = 'setextHeadingLineSequence'

// Strong (`**alpha**`).
// Includes `strongSequence` and `strongText`.
export const strong = 'strong'

// Sequence of strong markers (`**` or `__`).
export const strongSequence = 'strongSequence'

// Strong text (`alpha`).
// Includes text.
export const strongText = 'strongText'

// Whole thematic break:
//
// ```markdown
// * * *
// ```
//
// Includes `thematicBreakSequence` and `whitespace`.
export const thematicBreak = 'thematicBreak'

// A sequence of one or more thematic break markers (`***`).
export const thematicBreakSequence = 'thematicBreakSequence'

// Whole block quote:
//
// ```markdown
// > a
// >
// > b
// ```
//
// Includes `blockQuotePrefix` and flow.
export const blockQuote = 'blockQuote'
// The `>` or `> ` of a block quote.
export const blockQuotePrefix = 'blockQuotePrefix'
// The `>` of a block quote prefix.
export const blockQuoteMarker = 'blockQuoteMarker'
// The optional ` ` of a block quote prefix.
export const blockQuotePrefixWhitespace = 'blockQuotePrefixWhitespace'

// Whole unordered list:
//
// ```markdown
// - a
//   b
// ```
//
// Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
// lines.
export const listOrdered = 'listOrdered'

// Whole ordered list:
//
// ```markdown
// 1. a
//    b
// ```
//
// Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
// lines.
export const listUnordered = 'listUnordered'

// The indent of further list item lines.
export const listItemIndent = 'listItemIndent'

// A marker, as in, `*`, `+`, `-`, `.`, or `)`.
export const listItemMarker = 'listItemMarker'

// The thing that starts a list item, such as `1. `.
// Includes `listItemValue` if ordered, `listItemMarker`, and
// `listItemPrefixWhitespace` (unless followed by a line ending).
export const listItemPrefix = 'listItemPrefix'

// The whitespace after a marker.
export const listItemPrefixWhitespace = 'listItemPrefixWhitespace'

// The numerical value of an ordered item.
export const listItemValue = 'listItemValue'

// Internal types used for subtokenizers, compiled away
export const chunkContent = 'chunkContent'
export const chunkFlow = 'chunkFlow'
export const chunkParagraph = 'chunkParagraph'
export const chunkText = 'chunkText'
export const chunkString = 'chunkString'
