/**
 * @typedef {import('../types.js').Point} Point
 */

/**
 * Move a point a bit.
 *
 * Note: `move` only works inside lines! It’s not possible to move past other
 * chunks (replacement characters, tabs, or line endings).
 *
 * @param {Point} point
 * @param {number} offset
 * @returns {void}
 */
export function movePoint(point, offset) {
  point.column += offset
  point.offset += offset
  point._bufferIndex += offset
}
