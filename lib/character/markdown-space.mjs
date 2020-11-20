export default markdownSpace

import * as codes from './codes.mjs'

function markdownSpace(code) {
  return (
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
