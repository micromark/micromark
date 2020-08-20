module.exports = movePoint

// Note! `move` only works inside lines! It’s not possible to move past other
// chunks (replacement characters, tabs, or line endings).
function movePoint(chunks, point, offset) {
  point.column += offset
  point.offset += offset

  if (offset > -1) {
    if (point._bufferIndex < 0) {
      point._bufferIndex = 0
    }
  } else {
    if (point._bufferIndex < 0) {
      point._index--
      point._bufferIndex = chunks[point._index].length
    }
  }

  point._bufferIndex += offset

  return point
}
