module.exports = movePoint

// Note! `move` only works inside lines! It’s not possible to move past other
// chunks (replacement characters, tabs, or line endings).
function movePoint(chunks, point, offset) {
  point.column += offset
  point.offset += offset

  if (offset > -1) {
    if (point.bufferIndex < 0) {
      point.bufferIndex = 0
    }
  } else {
    if (point.bufferIndex < 0) {
      point.index--
      point.bufferIndex = chunks[point.index].length
    }
  }

  point.bufferIndex += offset

  return point
}
