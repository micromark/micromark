import {compileHtml} from './compile/html.js'
import {parse} from './parse.js'
import {postprocess} from './postprocess.js'
import {preprocess} from './preprocess.js'

export function buffer(value, encoding, options) {
  if (typeof encoding !== 'string') {
    options = encoding
    encoding = undefined
  }

  return compileHtml(options)(
    postprocess(
      parse(options).document().write(preprocess()(value, encoding, true))
    )
  )
}
