/**
 * @typedef {import('micromark').TokenizeContext} TokenizeContext
 * @typedef {import('micromark').Event} Event
 * @typedef {import('micromark').Resolver} Resolver
 */

/**
 * Call all `resolveAll`s.
 *
 * @param {{resolveAll?: Resolver}[]} constructs
 * @param {Event[]} events
 * @param {TokenizeContext} context
 * @returns {Event[]}
 */
export function resolveAll(constructs, events, context) {
  /** @type {Resolver[]} */
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
