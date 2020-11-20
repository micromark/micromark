export default markdownLineEnding

import * as codes from './codes.mjs'

function markdownLineEnding(code) {
  return code < codes.horizontalTab
}
