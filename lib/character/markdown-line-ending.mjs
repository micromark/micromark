export default markdownLineEnding

import * as codes from './codes'

function markdownLineEnding(code) {
  return code < codes.horizontalTab
}
