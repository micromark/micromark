import {content} from './initialize/content.js'
import {document} from './initialize/document.js'
import {flow} from './initialize/flow.js'
import {text, string} from './initialize/text.js'
import {combineExtensions} from './util/combine-extensions.js'
import {createTokenizer} from './util/create-tokenizer.js'
import {miniflat} from './util/miniflat.js'
import * as constructs from './constructs.js'

export function parse(options) {
  var settings = options || {}
  var parser = {
    defined: [],
    constructs: combineExtensions(
      [constructs].concat(miniflat(settings.extensions))
    ),
    content: create(content),
    document: create(document),
    flow: create(flow),
    string: create(string),
    text: create(text)
  }

  return parser

  function create(initializer) {
    return creator
    function creator(from) {
      return createTokenizer(parser, initializer, from)
    }
  }
}
