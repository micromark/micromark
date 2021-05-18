/**
 * @typedef {import('../types.js').Resolve} Resolve
 * @typedef {import('../types.js').Event} Event
 * @typedef {import('../types.js').Tokenizer} Tokenizer
 */

/**
 * Call all `resolveAll`s.
 *
 * @param {{resolveAll?: Resolve}[]} constructs
 * @param {Event[]} events
 * @param {Tokenizer} context
 * @returns {Event[]}
 */
export function resolveAll(constructs, events, context) {
  /** @type {Resolve[]} */
  const called = []
  let index = -1

  while (++index < constructs.length) {
    const resolve = constructs[index].resolveAll

    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context)
      called.push(resolve)
    }
  }

  return events
}
