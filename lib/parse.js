module.exports = createParser

var own = require('./constant/has-own-property')
var initializeContent = require('./initialize/content')
var initializeDocument = require('./initialize/document')
var initializeFlow = require('./initialize/flow')
var initializeText = require('./initialize/text')
var constructs = require('./constructs')

var createTokenizer = require('./util/create-tokenizer')

function createParser(options) {
  var settings = options || {}
  var parser

  parser = {
    defined: [],
    constructs: configure([constructs].concat(settings.extensions || [])),
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

function configure(extensions) {
  var all = {}
  var length = extensions.length
  var index = -1

  while (++index < length) {
    extension(all, extensions[index])
  }

  return all
}

function extension(all, extension) {
  var hook
  var left
  var right
  var code
  var constructs

  for (hook in extension) {
    left = own.call(all, hook) ? all[hook] : (all[hook] = {})
    right = extension[hook]

    for (code in right) {
      // Note: we prefer the extension over existing constructs.
      // There’s no other precedence.
      constructs = [].concat(
        right[code],
        own.call(left, code) ? left[code] : []
      )

      left[code] = constructs.length === 1 ? constructs[0] : constructs
    }
  }
}
