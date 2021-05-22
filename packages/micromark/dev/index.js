/**
 * @typedef {import('./lib/parse.js').Options} ParseOptions
 * @typedef {import('./lib/parse.js').ParseContext} ParseContext
 * @typedef {import('./lib/parse.js').Extension} Extension
 * @typedef {import('./lib/parse.js').NormalizedExtension} NormalizedExtension
 * @typedef {import('./lib/compile.js').Handle} Handle
 * @typedef {import('./lib/compile.js').DocumentHandle} DocumentHandle
 * @typedef {import('./lib/compile.js').HtmlExtension} HtmlExtension
 * @typedef {import('./lib/compile.js').Options} CompileOptions
 * @typedef {import('./lib/preprocess.js').Value} Value
 * @typedef {import('./lib/preprocess.js').Encoding} Encoding
 * @typedef {import('./lib/create-tokenizer.js').Code} Code
 * @typedef {import('./lib/create-tokenizer.js').Chunk} Chunk
 * @typedef {import('./lib/create-tokenizer.js').Type} Type
 * @typedef {import('./lib/create-tokenizer.js').ContentType} ContentType
 * @typedef {import('./lib/create-tokenizer.js').Point} Point
 * @typedef {import('./lib/create-tokenizer.js').Token} Token
 * @typedef {import('./lib/create-tokenizer.js').Event} Event
 * @typedef {import('./lib/create-tokenizer.js').Effects} Effects
 * @typedef {import('./lib/create-tokenizer.js').State} State
 * @typedef {import('./lib/create-tokenizer.js').Resolver} Resolver
 * @typedef {import('./lib/create-tokenizer.js').Tokenizer} Tokenizer
 * @typedef {import('./lib/create-tokenizer.js').Initializer} Initializer
 * @typedef {import('./lib/create-tokenizer.js').Exiter} Exiter
 * @typedef {import('./lib/create-tokenizer.js').Previous} Previous
 * @typedef {import('./lib/create-tokenizer.js').Construct} Construct
 * @typedef {import('./lib/create-tokenizer.js').InitialConstruct} InitialConstruct
 * @typedef {import('./lib/create-tokenizer.js').ConstructRecord} ConstructRecord
 * @typedef {import('./lib/create-tokenizer.js').TokenizeContext} TokenizeContext
 *
 * @typedef {ParseOptions & CompileOptions} Options
 */

export {buffer as micromark} from './lib/buffer.js'
