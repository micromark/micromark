/**
 * @typedef {import('../types.js').Chunk} Chunk
 */

/**
 * Measure the number of character codes in chunks.
 * Counts tabs based on their expanded size, and CR+LF as one character.
 *
 * @param {Chunk[]} chunks
 * @returns {number}
 */
export function sizeChunks(chunks) {
  let index = -1
  let size = 0

  while (++index < chunks.length) {
    const chunk = chunks[index]
    size += typeof chunk === 'string' ? chunk.length : 1
  }

  return size
}
