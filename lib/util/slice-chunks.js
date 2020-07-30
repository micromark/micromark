module.exports = sliceChunks

function sliceChunks(chunks, token) {
  var startIndex = token.start.index
  var startBufferIndex = token.start.bufferIndex
  var endIndex = token.end.index
  var endBufferIndex = token.end.bufferIndex
  var view = chunks.slice(startIndex, endIndex + 1)
  var length = view.length

  if (startIndex === endIndex && startBufferIndex > -1 && endBufferIndex > -1) {
    view[0] = view[0].slice(startBufferIndex, endBufferIndex)
  } else {
    if (startBufferIndex > -1) {
      view[0] = view[0].slice(startBufferIndex)
    }

    if (endBufferIndex < 0) {
      view.pop()
    } else {
      view[length - 1] = view[length - 1].slice(0, endBufferIndex)
    }
  }

  return view
}
