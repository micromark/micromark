/**
 * @import {Event} from 'micromark-util-types'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {EditMap} from 'micromark-util-edit-map'

test('EditMap', async function (t) {
  await t.test('should do nothing without edits', async function () {
    const events = [event('a'), event('b')]
    const editMap = new EditMap()

    editMap.consume(events)

    assert.deepEqual(types(events), ['a', 'b'])
  })

  await t.test('should do nothing for a no-op edit', async function () {
    const events = [event('a')]
    const editMap = new EditMap()

    editMap.add(0, 0, [])
    editMap.consume(events)

    assert.deepEqual(types(events), ['a'])
  })

  await t.test('should add items at an index', async function () {
    const events = [event('a'), event('b')]
    const editMap = new EditMap()

    editMap.add(1, 0, [event('x')])
    editMap.consume(events)

    assert.deepEqual(types(events), ['a', 'x', 'b'])
  })

  await t.test('should remove items at an index', async function () {
    const events = [event('a'), event('b'), event('c')]
    const editMap = new EditMap()

    editMap.add(1, 1, [])
    editMap.consume(events)

    assert.deepEqual(types(events), ['a', 'c'])
  })

  await t.test(
    'should merge a second `add` at the same index, after previous additions',
    async function () {
      const events = [event('a')]
      const editMap = new EditMap()

      editMap.add(1, 0, [event('x')])
      editMap.add(1, 0, [event('y')])
      editMap.consume(events)

      assert.deepEqual(types(events), ['a', 'x', 'y'])
    }
  )

  await t.test(
    'should merge a second `add` at the same index that also removes',
    async function () {
      const events = [event('a'), event('b'), event('c')]
      const editMap = new EditMap()

      editMap.add(1, 1, [event('x')])
      editMap.add(1, 1, [event('y')])
      editMap.consume(events)

      assert.deepEqual(types(events), ['a', 'x', 'y'])
    }
  )

  await t.test(
    'should insert `addBefore` before previous additions at the same index',
    async function () {
      const events = [event('a')]
      const editMap = new EditMap()

      editMap.add(1, 0, [event('x')])
      editMap.addBefore(1, 0, [event('y')])
      editMap.consume(events)

      assert.deepEqual(types(events), ['a', 'y', 'x'])
    }
  )

  await t.test('should sort multiple edits by index', async function () {
    const events = [event('a'), event('b'), event('c')]
    const editMap = new EditMap()

    editMap.add(2, 0, [event('z')])
    editMap.add(0, 0, [event('y')])
    editMap.consume(events)

    assert.deepEqual(types(events), ['y', 'a', 'b', 'z', 'c'])
  })
})

/**
 * @param {string} type
 * @returns {Event}
 */
function event(type) {
  // @ts-expect-error: fine for testing.
  return ['enter', {type}, {}]
}

/**
 * @param {Array<Event>} events
 * @returns {Array<string>}
 */
function types(events) {
  return events.map(function (d) {
    return d[1].type
  })
}
