import * as codes from './codes'

// Note: EOF is seen as ASCII control here, because `null < 32 == true`.
export default function asciiControl(code: number) {
  return (
    // Special whitespace codes (which have negative codes) or `nul` through `del`…
    code < codes.space || code === codes.del
  )
}
