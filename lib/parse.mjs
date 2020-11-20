export default parse

import * as initializeContent from './initialize/content'
import * as initializeDocument from './initialize/document'
import * as initializeFlow from './initialize/flow'
import * as initializeText from './initialize/text'
import combineExtensions from './util/combine-extensions'
import createTokenizer from './util/create-tokenizer'
import miniflat from './util/miniflat'
import * as constructs from './constructs'

function parse(options) {
  var settings = options || {}
  var parser = {
    defined: [],
    constructs: combineExtensions(
      [constructs].concat(miniflat(settings.extensions))
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
