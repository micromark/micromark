import * as  assert from 'assert'
import * as  codes from '../character/codes'
import * as values from '../character/values'
import fromCharCode from '../constant/from-char-code'

export default function serializeChunks(chunks: any) {
  var length = chunks.length
  var index = -1
  var result = []
  var chunk
  var value
  var atTab

  while (++index < length) {
    chunk = chunks[index]

    if (typeof chunk === 'string') {
      value = chunk
    } else if (chunk === codes.carriageReturnLineFeed) {
      value = values.cr + values.lf
    } else if (chunk === codes.carriageReturn) {
      value = values.cr
    } else if (chunk === codes.lineFeed) {
      value = values.lf
    } else if (chunk === codes.horizontalTab) {
      value = values.ht
    } else if (chunk === codes.virtualSpace) {
      if (atTab) continue
      value = values.space
    } else {
      assert.equal(typeof chunk, 'number', 'expected number')
      // Currently only replacement character.
      value = fromCharCode(chunk)
    }

    atTab = chunk === codes.horizontalTab
    result.push(value)
  }

  return result.join('')
}
