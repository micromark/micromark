/**
 * @typedef {import('./parse.js').Create} _Create
 * @typedef {import('./parse.js').Options} ParseOptions
 * @typedef {import('./parse.js').ParseContext} ParseContext
 * @typedef {import('./parse.js').Extension} Extension
 * @typedef {import('./parse.js').NormalizedExtension} NormalizedExtension
 * @typedef {import('./compile.js').Handle} Handle
 * @typedef {import('./compile.js').DocumentHandle} DocumentHandle
 * @typedef {import('./compile.js').HtmlExtension} HtmlExtension
 * @typedef {import('./compile.js').Options} CompileOptions
 * @typedef {import('./preprocess.js').Value} Value
 * @typedef {import('./preprocess.js').Encoding} Encoding
 * @typedef {import('./create-tokenizer.js').Code} Code
 * @typedef {import('./create-tokenizer.js').Chunk} Chunk
 * @typedef {import('./create-tokenizer.js').Type} Type
 * @typedef {import('./create-tokenizer.js').ContentType} ContentType
 * @typedef {import('./create-tokenizer.js').Point} Point
 * @typedef {import('./create-tokenizer.js').Token} Token
 * @typedef {import('./create-tokenizer.js').Event} Event
 * @typedef {import('./create-tokenizer.js').Effects} Effects
 * @typedef {import('./create-tokenizer.js').State} State
 * @typedef {import('./create-tokenizer.js').Resolver} Resolver
 * @typedef {import('./create-tokenizer.js').Tokenizer} Tokenizer
 * @typedef {import('./create-tokenizer.js').Initializer} Initializer
 * @typedef {import('./create-tokenizer.js').Exiter} Exiter
 * @typedef {import('./create-tokenizer.js').Previous} Previous
 * @typedef {import('./create-tokenizer.js').Construct} Construct
 * @typedef {import('./create-tokenizer.js').InitialConstruct} InitialConstruct
 * @typedef {import('./create-tokenizer.js').ConstructRecord} ConstructRecord
 * @typedef {import('./create-tokenizer.js').TokenizeContext} TokenizeContext
 *
 * @typedef {ParseOptions & CompileOptions} Options
 */

import {buffer} from './buffer.js'
export {buffer, buffer as micromark}
