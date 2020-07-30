module.exports = movePoint

function movePoint(point, offset) {
  if (point.bufferIndex < 0) point.bufferIndex = 0
  point.column += offset
  point.offset += offset
  point.bufferIndex += offset
  return point
}
