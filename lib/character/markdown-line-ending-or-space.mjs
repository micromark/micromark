export default markdownLineEndingOrSpace

import * as codes from './codes'

function markdownLineEndingOrSpace(code) {
  return code < codes.nul || code === codes.space
}
