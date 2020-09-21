module.exports = createParser

var initializeContent = require('./initialize/content')
var initializeDocument = require('./initialize/document')
var initializeFlow = require('./initialize/flow')
var initializeText = require('./initialize/text')
var constructs = require('./constructs')

var createTokenizer = require('./util/create-tokenizer')
var combineExtensions = require('./util/combine-extensions')

function createParser(options) {
  var settings = options || {}
  var parser

  parser = {
    defined: [],
    constructs: combineExtensions(
      [constructs].concat(settings.extensions || [])
    ),
    content: create(initializeContent),
    document: create(initializeDocument),
    flow: create(initializeFlow),
    string: create(initializeText.string),
    text: create(initializeText.text)
  }

  return parser

  function create(initializer) {
    return creator
    function creator(from) {
      return createTokenizer(parser, initializer, from)
    }
  }
}
