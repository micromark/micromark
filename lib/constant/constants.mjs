// This module is compiled away!
//
// Parsing markdown comes with a couple of constants, such as minimum or maximum
// sizes of certain sequences.
// Additionally, there are a couple symbols used inside micromark.
// These are all defined here, but compiled away by scripts.
export var attentionSideBefore = 1 // Symbol to mark an attention sequence as before content: `*a`
export var attentionSideAfter = 2 // Symbol to mark an attention sequence as after content: `a*`
export var atxHeadingOpeningFenceSizeMax = 6 // 6 number signs is fine, 7 isn’t.
export var autolinkDomainSizeMax = 63 // 63 characters is fine, 64 is too many.
export var autolinkSchemeSizeMax = 32 // 32 characters is fine, 33 is too many.
export var cdataOpeningString = 'CDATA[' // And preceded by `<![`.
export var characterGroupWhitespace = 1 // Symbol used to indicate a character is whitespace
export var characterGroupPunctuation = 2 // Symbol used to indicate a character is whitespace
export var characterReferenceDecimalSizeMax = 7 // `&#9999999;`.
export var characterReferenceHexadecimalSizeMax = 6 // `&#xff9999;`.
export var characterReferenceNamedSizeMax = 31 // `&CounterClockwiseContourIntegral;`.
export var codeFencedSequenceSizeMin = 3 // At least 3 ticks or tildes are needed.
export var contentTypeFlow = 'flow'
export var contentTypeContent = 'content'
export var contentTypeString = 'string'
export var contentTypeText = 'text'
export var hardBreakPrefixSizeMin = 2 // At least 2 trailing spaces are needed.
export var htmlRaw = 1 // Symbol for `<script>`
export var htmlComment = 2 // Symbol for `<!---->`
export var htmlInstruction = 3 // Symbol for `<?php?>`
export var htmlDeclaration = 4 // Symbol for `<!doctype>`
export var htmlCdata = 5 // Symbol for `<![CDATA[]]>`
export var htmlBasic = 6 // Symbol for `<div`
export var htmlComplete = 7 // Symbol for `<x>`
export var htmlRawSizeMax = 8 // Length of `textarea`.
export var linkResourceDestinationBalanceMax = 3 // See: <https://spec.commonmark.org/0.29/#link-destination>
export var linkReferenceSizeMax = 999 // See: <https://spec.commonmark.org/0.29/#link-label>
export var listItemValueSizeMax = 10 // See: <https://spec.commonmark.org/0.29/#ordered-list-marker>
export var numericBaseDecimal = 10
export var numericBaseHexadecimal = 0x10
export var tabSize = 4 // Tabs have a hard-coded size of 4, per CommonMark.
export var thematicBreakMarkerCountMin = 3 // At least 3 asterisks, dashes, or underscores are needed.
export var v8MaxSafeChunkSize = 10000 // V8 (and potentially others) have problems injecting giant arrays into other arrays, hence we operate in chunks.
