import {constants} from 'micromark-util-symbol'

/**
 *
 * @template {{} | null} T
 * @param {T[]=} initial
 * @returns {import("micromark-util-types").SpliceBuffer<T>}
 */
export function spliceBuffer(initial) {
  /** @type {T[]} */
  const left = initial ? [...initial] : []
  /** @type {T[]} */
  const right = []

  /**
   * Avoid stack overflow by pushing items onto the stack in segments
   *
   * @param {T[]} array
   * @param {T[]} items
   */
  function chunkedPush(array, items) {
    /** @type number */
    let chunkStart = 0

    if (items.length < constants.v8MaxSafeChunkSize) {
      array.push(...items)
    } else {
      while (chunkStart < items.length) {
        array.push(
          ...items.slice(chunkStart, chunkStart + constants.v8MaxSafeChunkSize)
        )
        chunkStart += constants.v8MaxSafeChunkSize
      }
    }
  }

  /**
   * Move the cursor to a specific position in the array. Requires
   * time proportional to the distance moved.
   *
   * If n < 0, the cursor will end up at the beginning.
   * If n > length, the cursor will end up at the end.
   *
   * @param {number} n
   */
  function setCursor(n) {
    if (
      n === left.length ||
      (n > left.length && right.length === 0) ||
      (n < 0 && left.length === 0)
    )
      return
    if (n < left.length) {
      // Move cursor to the left
      const removed = left.splice(n, Number.POSITIVE_INFINITY)
      chunkedPush(right, removed.reverse())
    } else {
      // Move cursor to the right
      const removed = right.splice(
        left.length + right.length - n,
        Number.POSITIVE_INFINITY
      )
      chunkedPush(left, removed.reverse())
    }
  }

  /**
   * Array access for the splice buffer (constant time)
   *
   * @param {number} index
   * @returns Event
   */
  function get(index) {
    if (index < 0 || index >= left.length + right.length)
      throw new RangeError(
        `index ${index} in a buffer of size ${left.length + right.length}`
      )
    if (index < left.length) return left[index]
    return right[right.length - index + left.length - 1]
  }

  /**
   *
   * @param {number} start
   * @param {number=} deleteCount
   * @param {T[]=} items
   */
  function splice(start, deleteCount, items) {
    /** @type number */
    const count = deleteCount || 0

    setCursor(Math.trunc(start))
    const removed = right.splice(right.length - count, Number.POSITIVE_INFINITY)
    if (items) chunkedPush(left, items)
    return removed.reverse()
  }

  /**
   * @returns T | undefined
   */
  function pop() {
    setCursor(Number.POSITIVE_INFINITY)
    return left.pop()
  }

  /**
   * @param {T} item
   */
  function push(item) {
    setCursor(Number.POSITIVE_INFINITY)
    left.push(item)
  }

  /**
   * @param {T[]} items
   */
  function pushMany(items) {
    setCursor(Number.POSITIVE_INFINITY)
    chunkedPush(left, items)
  }

  /**
   * @param {T} item
   */
  function unshift(item) {
    setCursor(0)
    right.push(item)
  }

  /**
   * @param {T[]} items
   */
  function unshiftMany(items) {
    setCursor(0)
    chunkedPush(right, items.reverse())
  }

  /**
   * @returns T | undefined
   */
  function shift() {
    setCursor(0)
    return right.pop()
  }

  /**
   * @param {number} start
   * @param {number=} end
   */
  function slice(start, end) {
    /** @type number */
    const stop = end === undefined ? Number.POSITIVE_INFINITY : end

    if (stop < left.length) {
      return left.slice(start, end)
    }

    if (start > left.length) {
      return right
        .slice(
          right.length - stop + left.length,
          right.length - start + left.length
        )
        .reverse()
    }

    return left
      .slice(start)
      .concat(right.slice(right.length - stop + left.length).reverse())
  }

  return {
    splice,
    push,
    pushMany,
    pop,
    unshift,
    unshiftMany,
    shift,
    slice,
    get,
    get length() {
      return left.length + right.length
    }
  }
}
