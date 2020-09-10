module.exports = buffer

import * as codes from './character/codes'
import compiler from './compile/html'
import flatMap from './util/flat-map'
import parser from './parse'
import preprocessor from './preprocess'
import postprocessor from './postprocess'

function buffer(value: any, encoding: any, options: any) {
  if (typeof encoding !== 'string') {
    options = encoding
    encoding = undefined
  }

  return compiler(options)(
    postprocessor()(
      flatMap(
        flatMap([value, codes.eof], preprocessor(), encoding),
        parser().document().write
      )
    )
  )
}
