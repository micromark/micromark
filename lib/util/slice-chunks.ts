import type { Token } from '../types'
import * as assert from 'assert'

export default function sliceChunks(chunks: any[], token: Token) {
  var startIndex = token.start._index
  var startBufferIndex = token.start._bufferIndex
  var endIndex = token.end._index
  var endBufferIndex = token.end._bufferIndex
  var view

  if (startIndex === endIndex) {
    assert(endBufferIndex > -1, 'expected non-negative end buffer index')
    view = [
      chunks[startIndex].slice(
        startBufferIndex < 0 ? 0 : startBufferIndex,
        endBufferIndex
      )
    ]
  } else {
    view = chunks.slice(startIndex, endIndex)

    if (startBufferIndex > -1) {
      view[0] = view[0].slice(startBufferIndex)
    }

    if (endBufferIndex > -1) {
      view.push(chunks[endIndex].slice(0, endBufferIndex))
    }
  }

  return view
}
