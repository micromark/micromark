// This module is compiled away!
//
// Here is the list of all types of tokens exposed by micromark, with a short
// explanation of what they include and where they are found.
// In picking names, generally, the rule is to be as explicit as possible
// instead of reusing names.
// For example, there is a `definitionDestination` and a `resourceDestination`,
// instead of one shared name.

// Generic type for data, such as in a title, a destination, etc.
export var data = 'data'

// Generic type for syntactic whitespace (tabs, virtual spaces, spaces).
// Such as, between a fenced code fence and an info string.
export var whitespace = 'whitespace'

// Generic type for line endings (line feed, carriage return, carriage return +
// line feed).
export var lineEnding = 'lineEnding'

// A line ending, but ending a blank line.
export var lineEndingBlank = 'lineEndingBlank'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the start of a
// line.
export var linePrefix = 'linePrefix'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the end of a
// line.
export var lineSuffix = 'lineSuffix'

// Whole ATX heading:
//
// ```markdown
// #
// ## Alpha
// ### Bravo ###
// ```
//
// Includes `atxHeadingSequence`, `whitespace`, `atxHeadingText`.
export var atxHeading = 'atxHeading'

// Sequence of number signs in an ATX heading (`###`).
export var atxHeadingSequence = 'atxHeadingSequence'

// Content in an ATX heading (`alpha`).
// Includes text.
export var atxHeadingText = 'atxHeadingText'

// Whole autolink (`<https://example.com>` or `<admin@example.com>`)
// Includes `autolinkMarker` and `autolinkProtocol` or `autolinkEmail`.
export var autolink = 'autolink'

// Email autolink w/o markers (`admin@example.com`)
export var autolinkEmail = 'autolinkEmail'

// Marker around an `autolinkProtocol` or `autolinkEmail` (`<` or `>`).
export var autolinkMarker = 'autolinkMarker'

// Protocol autolink w/o markers (`https://example.com`)
export var autolinkProtocol = 'autolinkProtocol'

// A whole character escape (`\-`).
// Includes `escapeMarker` and `characterEscapeValue`.
export var characterEscape = 'characterEscape'

// The escaped character (`-`).
export var characterEscapeValue = 'characterEscapeValue'

// A whole character reference (`&amp;`, `&#8800;`, or `&#x1D306;`).
// Includes `characterReferenceMarker`, an optional
// `characterReferenceMarkerNumeric`, in which case an optional
// `characterReferenceMarkerHexadecimal`, and a `characterReferenceValue`.
export var characterReference = 'characterReference'

// The start or end marker (`&` or `;`).
export var characterReferenceMarker = 'characterReferenceMarker'

// Mark reference as numeric (`#`).
export var characterReferenceMarkerNumeric = 'characterReferenceMarkerNumeric'

// Mark reference as numeric (`x` or `X`).
export var characterReferenceMarkerHexadecimal =
  'characterReferenceMarkerHexadecimal'

// Value of character reference w/o markers (`amp`, `8800`, or `1D306`).
export var characterReferenceValue = 'characterReferenceValue'

// Whole fenced code:
//
// ````markdown
// ```js
// alert(1)
// ```
// ````
export var codeFenced = 'codeFenced'

// A fenced code fence, including whitespace, sequence, info, and meta
// (` ```js `).
export var codeFencedFence = 'codeFencedFence'

// Sequence of grave accent or tilde characters (` ``` `) in a fence.
export var codeFencedFenceSequence = 'codeFencedFenceSequence'

// Info word (`js`) in a fence.
// Includes string.
export var codeFencedFenceInfo = 'codeFencedFenceInfo'

// Meta words (`highlight="1"`) in a fence.
// Includes string.
export var codeFencedFenceMeta = 'codeFencedFenceMeta'

// A line of code.
export var codeFlowValue = 'codeFlowValue'

// Whole indented code:
//
// ```markdown
//     alert(1)
// ```
//
// Includes `lineEnding`, `linePrefix`, and `codeFlowValue`.
export var codeIndented = 'codeIndented'

// A text code (``` `alpha` ```).
// Includes `codeTextSequence`, `codeTextData`, `lineEnding`, and can include
// `codeTextPadding`.
export var codeText = 'codeText'

export var codeTextData = 'codeTextData'

// A space or line ending right after or before a tick.
export var codeTextPadding = 'codeTextPadding'

// A text code fence (` `` `).
export var codeTextSequence = 'codeTextSequence'

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
export var content = 'content'
// Whole definition:
//
// ```markdown
// [micromark]: https://github.com/micromark/micromark
// ```
//
// Includes `definitionLabel`, `definitionMarker`, `whitespace`,
// `definitionDestination`, and optionally `lineEnding` and `definitionTitle`.
export var definition = 'definition'

// Destination of a definition (`https://github.com/micromark/micromark` or
// `<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationLiteral` or `definitionDestinationRaw`.
export var definitionDestination = 'definitionDestination'

// Enclosed destination of a definition
// (`<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationLiteralMarker` and optionally
// `definitionDestinationString`.
export var definitionDestinationLiteral = 'definitionDestinationLiteral'

// Markers of an enclosed definition destination (`<` or `>`).
export var definitionDestinationLiteralMarker =
  'definitionDestinationLiteralMarker'

// Unenclosed destination of a definition
// (`https://github.com/micromark/micromark`).
// Includes `definitionDestinationString`.
export var definitionDestinationRaw = 'definitionDestinationRaw'

// Text in an destination (`https://github.com/micromark/micromark`).
// Includes string.
export var definitionDestinationString = 'definitionDestinationString'

// Label of a definition (`[micromark]`).
// Includes `definitionLabelMarker` and `definitionLabelString`.
export var definitionLabel = 'definitionLabel'

// Markers of a definition label (`[` or `]`).
export var definitionLabelMarker = 'definitionLabelMarker'

// Value of a definition label (`micromark`).
// Includes string.
export var definitionLabelString = 'definitionLabelString'

// Marker between a label and a destination (`:`).
export var definitionMarker = 'definitionMarker'

// Title of a definition (`"x"`, `'y'`, or `(z)`).
// Includes `definitionTitleMarker` and optionally `definitionTitleString`.
export var definitionTitle = 'definitionTitle'

// Marker around a title of a definition (`"`, `'`, `(`, or `)`).
export var definitionTitleMarker = 'definitionTitleMarker'

// Data without markers in a title (`z`).
// Includes string.
export var definitionTitleString = 'definitionTitleString'

// Emphasis (`*alpha*`).
// Includes `emphasisSequence` and `emphasisText`.
export var emphasis = 'emphasis'

// Sequence of emphasis markers (`*` or `_`).
export var emphasisSequence = 'emphasisSequence'

// Emphasis text (`alpha`).
// Includes text.
export var emphasisText = 'emphasisText'

// The character escape marker (`\`).
export var escapeMarker = 'escapeMarker'

// A hard break created with a backslash (`\\n`).
// Includes `escapeMarker` (does not include the line ending)
export var hardBreakEscape = 'hardBreakEscape'

// A hard break created with trailing spaces (`  \n`).
// Does not include the line ending.
export var hardBreakTrailing = 'hardBreakTrailing'

// Flow HTML:
//
// ```markdown
// <div
// ```
//
// Inlcudes `lineEnding`, `htmlFlowData`.
export var htmlFlow = 'htmlFlow'

export var htmlFlowData = 'htmlFlowData'

// HTML in text (the tag in `a <i> b`).
// Includes `lineEnding`, `htmlTextData`.
export var htmlText = 'htmlText'

export var htmlTextData = 'htmlTextData'

// Whole image (`![alpha](bravo)`, `![alpha][bravo]`, `![alpha][]`, or
// `![alpha]`).
// Includes `label` and an optional `resource` or `reference`.
export var image = 'image'

// Whole link label (`[*alpha*]`).
// Includes `labelLink` or `labelImage`, `labelText`, and `labelEnd`.
export var label = 'label'

// Text in an label (`*alpha*`).
// Includes text.
export var labelText = 'labelText'

// Start a link label (`[`).
// Includes a `labelMarker`.
export var labelLink = 'labelLink'

// Start an image label (`![`).
// Includes `labelImageMarker` and `labelMarker`.
export var labelImage = 'labelImage'

// Marker of a label (`[` or `]`).
export var labelMarker = 'labelMarker'

// Marker to start an image (`!`).
export var labelImageMarker = 'labelImageMarker'

// End a label (`]`).
// Includes `labelMarker`.
export var labelEnd = 'labelEnd'

// Whole link (`[alpha](bravo)`, `[alpha][bravo]`, `[alpha][]`, or `[alpha]`).
// Includes `label` and an optional `resource` or `reference`.
export var link = 'link'

// Whole paragraph:
//
// ```markdown
// alpha
// bravo.
// ```
//
// Includes text.
export var paragraph = 'paragraph'

// A reference (`[alpha]` or `[]`).
// Includes `referenceMarker` and an optional `referenceString`.
export var reference = 'reference'

// A reference marker (`[` or `]`).
export var referenceMarker = 'referenceMarker'

// Reference text (`alpha`).
// Includes string.
export var referenceString = 'referenceString'

// A resource (`(https://example.com "alpha")`).
// Includes `resourceMarker`, an optional `resourceDestination` with an optional
// `whitespace` and `resourceTitle`.
export var resource = 'resource'

// A resource destination (`https://example.com`).
// Includes `resourceDestinationLiteral` or `resourceDestinationRaw`.
export var resourceDestination = 'resourceDestination'

// A literal resource destination (`<https://example.com>`).
// Includes `resourceDestinationLiteralMarker` and optionally
// `resourceDestinationString`.
export var resourceDestinationLiteral = 'resourceDestinationLiteral'

// A resource destination marker (`<` or `>`).
export var resourceDestinationLiteralMarker = 'resourceDestinationLiteralMarker'

// A raw resource destination (`https://example.com`).
// Includes `resourceDestinationString`.
export var resourceDestinationRaw = 'resourceDestinationRaw'

// Resource destination text (`https://example.com`).
// Includes string.
export var resourceDestinationString = 'resourceDestinationString'

// A resource marker (`(` or `)`).
export var resourceMarker = 'resourceMarker'

// A resource title (`"alpha"`, `'alpha'`, or `(alpha)`).
// Includes `resourceTitleMarker` and optionally `resourceTitleString`.
export var resourceTitle = 'resourceTitle'

// A resource title marker (`"`, `'`, `(`, or `)`).
export var resourceTitleMarker = 'resourceTitleMarker'

// Resource destination title (`alpha`).
// Includes string.
export var resourceTitleString = 'resourceTitleString'

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
export var setextHeading = 'setextHeading'

// Content in a setext heading (`alpha\nbravo`).
// Includes text.
export var setextHeadingText = 'setextHeadingText'

// Underline in a setext heading, including whitespace suffix (`==`).
// Includes `setextHeadingLineSequence`.
export var setextHeadingLine = 'setextHeadingLine'

// Sequence of equals or dash characters in underline in a setext heading (`-`).
export var setextHeadingLineSequence = 'setextHeadingLineSequence'

// Strong (`**alpha**`).
// Includes `strongSequence` and `strongText`.
export var strong = 'strong'

// Sequence of strong markers (`**` or `__`).
export var strongSequence = 'strongSequence'

// Strong text (`alpha`).
// Includes text.
export var strongText = 'strongText'

// Whole thematic break:
//
// ```markdown
// * * *
// ```
//
// Includes `thematicBreakSequence` and `whitespace`.
export var thematicBreak = 'thematicBreak'

// A sequence of one or more thematic break markers (`***`).
export var thematicBreakSequence = 'thematicBreakSequence'

// Whole block quote:
//
// ```markdown
// > a
// >
// > b
// ```
//
// Includes `blockQuotePrefix` and flow.
export var blockQuote = 'blockQuote'
// The `>` or `> ` of a block quote.
export var blockQuotePrefix = 'blockQuotePrefix'
// The `>` of a block quote prefix.
export var blockQuoteMarker = 'blockQuoteMarker'
// The optional ` ` of a block quote prefix.
export var blockQuotePrefixWhitespace = 'blockQuotePrefixWhitespace'

// Whole unordered list:
//
// ```markdown
// - a
//   b
// ```
//
// Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
// lines.
export var listOrdered = 'listOrdered'

// Whole ordered list:
//
// ```markdown
// 1. a
//    b
// ```
//
// Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
// lines.
export var listUnordered = 'listUnordered'

// The indent of further list item lines.
export var listItemIndent = 'listItemIndent'

// A marker, as in, `*`, `+`, `-`, `.`, or `)`.
export var listItemMarker = 'listItemMarker'

// The thing that starts a list item, such as `1. `.
// Includes `listItemValue` if ordered, `listItemMarker`, and
// `listItemPrefixWhitespace` (unless followed by a line ending).
export var listItemPrefix = 'listItemPrefix'

// The whitespace after a marker.
export var listItemPrefixWhitespace = 'listItemPrefixWhitespace'

// The numerical value of an ordered item.
export var listItemValue = 'listItemValue'

// Internal types used for subtokenizers, compiled away
export var chunkContent = 'chunkContent'
export var chunkFlow = 'chunkFlow'
export var chunkText = 'chunkText'
export var chunkString = 'chunkString'
