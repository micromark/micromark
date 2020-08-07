var assert = require('assert')

module.exports = sliceChunks

function sliceChunks(chunks, token) {
  var startIndex = token.start.index
  var startBufferIndex = token.start.bufferIndex
  var endIndex = token.end.index
  var endBufferIndex = token.end.bufferIndex
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
