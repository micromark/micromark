import {codes} from './codes.js'

// Note: EOF is seen as ASCII control here, because `null < 32 == true`.
export function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code < codes.space || code === codes.del
  )
}
