// This module is compiled away!

// Generic type for data, such as in a title, a destination, etc.
exports.data = 'data'

// Generic type for syntactic whitespace (tabs, virtual spaces, spaces).
// Such as, between a fenced code fence and an info string.
exports.whitespace = 'whitespace'

// Generic type for line endings (line feed, carriage return, carriage return +
// line feed).
exports.lineEnding = 'lineEnding'

// A line ending, but ending a blank line.
exports.lineEndingBlank = 'lineEndingBlank'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the start of a
// line.
exports.linePrefix = 'linePrefix'

// Generic type for whitespace (tabs, virtual spaces, spaces) at the end of a
// line.
exports.lineSuffix = 'lineSuffix'

// Whole ATX heading:
//
// ```markdown
// #
// ## Alpha
// ### Bravo ###
// ```
//
// Includes `atxHeadingSequence`, `whitespace`, `atxHeadingText`.
exports.atxHeading = 'atxHeading'

// Sequence of number signs in an ATX heading (`###`).
exports.atxHeadingSequence = 'atxHeadingSequence'

// Content in an ATX heading (`alpha`).
// Includes rich text data.
exports.atxHeadingText = 'atxHeadingText'

// Whole autolink (`<https://example.com>` or `<admin@example.com>`)
// Includes `autolinkMarker` and `autolinkUri` or `autolinkEmail`.
exports.autolink = 'autolink'

// Email autolink w/o markers (`<admin@example.com>`)
exports.autolinkEmail = 'autolinkEmail'

// Marker around an `autolinkUri` or `autolinkEmail` (`<` or `>`).
exports.autolinkMarker = 'autolinkMarker'

// URI autolink w/o markers (`https://example.com`)
exports.autolinkUri = 'autolinkUri'

// A whole character escape (`\-`).
// Includes `escapeMarker` and `characterEscapeValue`.
exports.characterEscape = 'characterEscape'

// The escaped character (`-`).
exports.characterEscapeValue = 'characterEscapeValue'

// A whole character reference (`&amp;`, `&#8800;`, or `&#x1D306;`).
// Includes `characterReferenceMarker`, an optional
// `characterReferenceMarkerNumeric`, in which case an optional
// `characterReferenceMarkerHexadecimal`, and a `characterReferenceValue`.
exports.characterReference = 'characterReference'

// The start or end marker (`&` or `;`).
exports.characterReferenceMarker = 'characterReferenceMarker'

// Mark reference as numeric (`#`).
exports.characterReferenceMarkerNumeric = 'characterReferenceMarkerNumeric'

// Mark reference as numeric (`x` or `X`).
exports.characterReferenceMarkerHexadecimal =
  'characterReferenceMarkerHexadecimal'

// Value of character reference w/o markers (`amp`, `8800`, or `1D306`).
exports.characterReferenceValue = 'characterReferenceValue'

// Whole fenced code:
//
// ````markdown
// ```js
// alert(1)
// ```
// ````
exports.codeFenced = 'codeFenced'

// A fenced code fence, including whitespace, sequence, info, and meta
// (` ```js `).
exports.codeFencedFence = 'codeFencedFence'

// Sequence of grave accent or tilde characters (` ``` `) in a fence.
exports.codeFencedFenceSequence = 'codeFencedFenceSequence'

// Info word (`js`) in a fence.
exports.codeFencedFenceInfo = 'codeFencedFenceInfo'

// Meta words (`highlight="1"`) in a fence.
exports.codeFencedFenceMeta = 'codeFencedFenceMeta'

// A line of data.
exports.codeFlowData = 'codeFlowData'

// Whole indented code:
//
// ```markdown
//     alert(1)
// ```
//
// Includes `lineEnding`, `linePrefix`, and `codeFlowData`.
exports.codeIndented = 'codeIndented'

// A code span (``` `alpha` ```).
// Includes `codeSpanFence` and optionally `whitespace` and `codeSpanData`.
exports.codeSpan = 'codeSpan'

// A code span fence (` `` `).
exports.codeSpanFence = 'codeSpanFence'

// Code span data (`alpha`).
exports.codeSpanData = 'codeSpanData'

// Whole content:
//
// ```markdown
// [a]: b
// c
// =
// d
// ```
//
// Includes `paragraph`, `definition`, `setextHeading`.
exports.content = 'content'
// Whole definition:
//
// ```markdown
// [micromark]: https://github.com/micromark/micromark
// ```
//
// Includes `definitionLabel`, `definitionMarker`, `whitespace`,
// `definitionDestination`, and optionally `lineEnding` and `definitionTitle`.
exports.definition = 'definition'

// Destination of a definition (`https://github.com/micromark/micromark` or
// `<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationLiteral` or `definitionDestinationRaw`.
exports.definitionDestination = 'definitionDestination'

// Enclosed destination of a definition
// (`<https://github.com/micromark/micromark>`).
// Includes `definitionDestinationMarker` and optionally
// `definitionDestinationText`.
exports.definitionDestinationLiteral = 'definitionDestinationLiteral'

// Markers of an enclosed definition destination (`<` or `>`).
exports.definitionDestinationMarker = 'definitionDestinationMarker'

// Unenclosed destination of a definition
// (`https://github.com/micromark/micromark`).
// Includes `definitionDestinationText`.
exports.definitionDestinationRaw = 'definitionDestinationRaw'

// Text in an destination (`https://github.com/micromark/micromark`).
// Includes plain text data.
exports.definitionDestinationText = 'definitionDestinationText'

// Label of a definition (`[micromark]`).
// Includes `definitionLabelMarker` and `definitionLabelData`.
exports.definitionLabel = 'definitionLabel'

// Markers of a definition label, used around label data (`[` or `]`).
exports.definitionLabelMarker = 'definitionLabelMarker'

// Data of a definition label (`micromark`).
// Includes plain text data.
exports.definitionLabelData = 'definitionLabelData'

// Marker between a label and a destination (`:`).
exports.definitionMarker = 'definitionMarker'

// Title of a definition (`"x"`, `'y'`, or `(z)`).
// Includes `definitionTitleMarker` and optionally `definitionTitleText`.
exports.definitionTitle = 'definitionTitle'

// Marker around a title of a definition (`"`, `'`, `(`, or `)`).
exports.definitionTitleMarker = 'definitionTitleMarker'

// Data without markers in a title (`z`).
// Includes plain text data.
exports.definitionTitleText = 'definitionTitleText'

// Emphasis (`*alpha*`).
// Includes `emphasisSequence` and `emphasisText`.
exports.emphasis = 'emphasis'

// Sequence of emphasis markers (`*` or `_`).
exports.emphasisSequence = 'emphasisSequence'

// Emphasis text (`alpha`).
// Includes rich text data.
exports.emphasisText = 'emphasisText'

// The character escape marker (`\`).
exports.escapeMarker = 'escapeMarker'

// A hard break created with a slash (`\\n`).
// Includes `escapeMarker` (does not include the line ending!)
exports.hardBreakEscape = 'hardBreakEscape'

// A hard break created with trailing whitespace (`  \n`).
// Includes `whitespace` and `lineEnding`.
exports.hardBreakTrailing = 'hardBreakTrailing'

// Whole flow HTML:
//
// ```markdown
// <div
// ```
exports.htmlFlow = 'htmlFlow'

// Whole span HTML (the tag in `a <i> b`).
exports.htmlSpan = 'htmlSpan'

// Whole image (`![alpha](bravo)`, `![alpha][bravo]`, `![alpha][]`, or
// `![alpha]`).
// Includes `label` and an optional `resource` or `reference`.
exports.image = 'image'

// Whole link label (`[*alpha*]`).
// Includes `labelLink` or `labelImage`, `labelText`, and `labelEnd`.
exports.label = 'label'

// Text in an label (`*alpha*`).
// Includes rich text data.
exports.labelText = 'labelText'

// Start a link label (`[`).
// Includes a `labelMarker`.
exports.labelLink = 'labelLink'

// Start an image label (`![`).
// Includes `labelMarkerImage` and `labelMarker`.
exports.labelImage = 'labelImage'

// Marker of a label (`[` or `]`).
exports.labelMarker = 'labelMarker'

// Marker to start an image (`!`).
exports.labelMarkerImage = 'labelMarkerImage'

// End a label (`]`).
// Includes `labelMarker`.
exports.labelEnd = 'labelEnd'

// Whole link (`[alpha](bravo)`, `[alpha][bravo]`, `[alpha][]`, or `[alpha]`).
// Includes `label` and an optional `resource` or `reference`.
exports.link = 'link'

// Whole paragraph:
//
// ```markdown
// alpha
// bravo.
// ```
//
// Includes rich text data.
exports.paragraph = 'paragraph'

// A reference (`[alpha]` or `[]`).
// Includes `referenceMarker` and an optional `referenceText`.
exports.reference = 'reference'

// A reference marker (`[` or `]`).
exports.referenceMarker = 'referenceMarker'

// Reference text (`alpha`).
// Includes plain text data.
exports.referenceText = 'referenceText'

// A resource (`(https://example.com "alpha")`).
// Includes `resourceMarker`, an optional `resourceDestination` with an optional
// `whitespace` and `resourceTitle`.
exports.resource = 'resource'

// A resource destination (`https://example.com`).
// Includes `resourceDestinationLiteral` or `resourceDestinationRaw`.
exports.resourceDestination = 'resourceDestination'

// A literal resource destination (`<https://example.com>`).
// Includes `resourceDestinationLiteralMarker` and optionally
// `resourceDestinationText`.
exports.resourceDestinationLiteral = 'resourceDestinationLiteral'

// A resource destination marker (`<` or `>`).
exports.resourceDestinationLiteralMarker = 'resourceDestinationLiteralMarker'

// A raw resource destination (`https://example.com`).
// Includes `resourceDestinationText`.
exports.resourceDestinationRaw = 'resourceDestinationRaw'

// Resource destination text (`https://example.com`).
// Includes plain text data.
exports.resourceDestinationText = 'resourceDestinationText'

// A resource marker (`(` or `)`).
exports.resourceMarker = 'resourceMarker'

// A resource title (`"alpha"`, `'alpha'`, or `(alpha)`).
// Includes `resourceTitleMarker` and optionally `resourceTitleText`.
exports.resourceTitle = 'resourceTitle'

// A resource title marker (`"`, `'`, `(`, or `)`).
exports.resourceTitleMarker = 'resourceTitleMarker'

// Resource destination title (`alpha`).
// Includes plain text data.
exports.resourceTitleText = 'resourceTitleText'

// Whole setext heading:
//
// ```markdown
// alpha
// bravo
// =====
// ```
//
// Includes `setextHeadingText` and `setextHeadingLine`.
exports.setextHeading = 'setextHeading'

// Content in a setext heading (`alpha\nbravo`).
// Includes rich text data.
exports.setextHeadingText = 'setextHeadingText'

// Underline in a setext heading, including whitespace prefix and suffix (`==`).
// Includes `setextHeadingLineSequence`.
exports.setextHeadingLine = 'setextHeadingLine'

// Sequence of equals or dash characters in underline in a setext heading (`-`).
exports.setextHeadingLineSequence = 'setextHeadingLineSequence'

// Strong (`**alpha**`).
// Includes `strongSequence` and `strongText`.
exports.strong = 'strong'

// Sequence of strong markers (`**` or `__`).
exports.strongSequence = 'strongSequence'

// Strong text (`alpha`).
// Includes rich text data.
exports.strongText = 'strongText'

// Whole thematic break:
//
// ```markdown
// * * *
// ```
//
// Includes `thematicBreakSequence` and `whitespace`.
exports.thematicBreak = 'thematicBreak'

// A sequence of one or more thematic break markers (`***`).
exports.thematicBreakSequence = 'thematicBreakSequence'
