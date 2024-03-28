/**
 *
 * @template {{} | null} T
 * @param {T[]=} initial
 * @returns {import("micromark-util-types").SpliceBuffer<T>}
 */
export function nullBuffer(initial) {
  /** @type {T[]} */
  const buf = initial ? [...initial] : []
  const length = () => buf.length

  const proxy = {
    /**
     *
     * @param {number} start
     * @param {number=} deleteCount
     * @param {T[]=} items
     * @returns
     */
    splice(start, deleteCount, items) {
      return buf.splice(start, deleteCount || 0, ...(items || []))
    },
    /**
     *
     * @param {T} item
     * @returns
     */
    push(item) {
      return buf.push(item)
    },
    /**
     *
     * @param {T[]} items
     * @returns
     */
    pushMany(items) {
      return buf.push(...items)
    },
    /**
     *
     * @returns
     */
    pop() {
      return buf.pop()
    },
    /**
     *
     * @param {T} item
     * @returns
     */
    unshift(item) {
      return buf.unshift(item)
    },
    /**
     *
     * @param {T[]} items
     * @returns
     */
    unshiftMany(items) {
      return buf.unshift(...items)
    },
    /**
     *
     * @returns
     */
    shift() {
      return buf.shift()
    },
    /**
     *
     * @param {number} start
     * @param {number} end
     * @returns
     */
    slice(start, end) {
      return buf.slice(start, end)
    },
    get length() {
      return length()
    }
  }
  return new Proxy(proxy, {
    /**
     * @param {typeof proxy} target
     * @param {keyof typeof proxy} property
     * @returns
     */
    get(target, property) {
      const index = Number.parseInt(property, 10)
      if (index.toString() === property) return buf[index]
      return target[property]
    },
    /**
     * @param {string | symbol} property
     * @param {T} newValue
     * @returns
     */
    set(_, property, newValue) {
      if (typeof property === 'symbol') return false
      const index = Number.parseInt(property, 10)
      if (index.toString() !== property) return false
      buf[index] = newValue
      return true
    }
  })
}
