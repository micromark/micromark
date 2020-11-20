export default buffer

import compiler from './compile/html'
import parser from './parse'
import postprocess from './postprocess'
import preprocessor from './preprocess'

function buffer(value, encoding, options) {
  if (typeof encoding !== 'string') {
    options = encoding
    encoding = undefined
  }

  return compiler(options)(
    postprocess(
      parser(options).document().write(preprocessor()(value, encoding, true))
    )
  )
}
