import type { Point } from "../types"

// Note! `move` only works inside lines! It’s not possible to move past other

// chunks (replacement characters, tabs, or line endings).
export default function movePoint(point: Point, offset: number) {
  point.column += offset
  point.offset += offset
  point._bufferIndex += offset
  return point
}
