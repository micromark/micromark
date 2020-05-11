module.exports = movePoint

function movePoint(point, offset) {
  point.column += offset
  point.offset += offset
  point.index += offset
  return point
}
