module.exports = createParser

var createTokenizer = require('./util/create-tokenizer')
var initializeContent = require('./initialize/content')
var initializeFlow = require('./initialize/flow')
var initializePlainText = require('./initialize/plain-text')
var initializeText = require('./initialize/text')

function createParser() {
  var parser = {
    hooks: {},
    content: create(initializeContent),
    flow: create(initializeFlow),
    plainText: create(initializePlainText),
    text: create(initializeText)
  }

  return parser

  function create(initializer) {
    return creator
    function creator(from) {
      return createTokenizer(parser, initializer, from)
    }
  }
}
