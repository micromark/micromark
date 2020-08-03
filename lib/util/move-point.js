module.exports = movePoint

// Note! `move` only works inside buffers, so it’s not possible to move past
// other chunks (replacement characters, tabs, or line endings).
function movePoint(point, offset) {
  if (point.bufferIndex < 0) point.bufferIndex = 0
  point.column += offset
  point.offset += offset
  point.bufferIndex += offset
  return point
}
