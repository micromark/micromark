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

  await t.test('should apply mixed edits against original indexes', async function () {
    const events = [
      event('a'),
      event('b'),
      event('c'),
      event('d'),
      event('e'),
      event('f'),
      event('g'),
      event('h')
    ]
    const editMap = new EditMap()

    editMap.add(6, 2, [event('x')])
    editMap.add(1, 2, [event('y'), event('z'), event('w')])
    editMap.add(4, 0, [event('q')])
    editMap.consume(events)

    assert.deepEqual(types(events), [
      'a',
      'y',
      'z',
      'w',
      'd',
      'q',
      'e',
      'f',
      'x'
    ])
  })

  await t.test('should keep later edits inside a removed range', async function () {
    const events = [
      event('a'),
      event('b'),
      event('c'),
      event('d'),
      event('e'),
      event('f')
    ]
    const editMap = new EditMap()

    editMap.add(1, 4, [event('x')])
    editMap.add(3, 1, [event('y')])
    editMap.consume(events)

    assert.deepEqual(types(events), ['a', 'x', 'y', 'e', 'f'])
  })

  await t.test('should support more edits after consume', async function () {
    const editMap = new EditMap()
    const first = [event('a'), event('b')]
    const second = [event('c'), event('d')]

    editMap.add(1, 0, [event('x')])
    editMap.consume(first)
    editMap.add(0, 1, [event('y')])
    editMap.consume(second)

    assert.deepEqual(types(first), ['a', 'x', 'b'])
    assert.deepEqual(types(second), ['y', 'd'])
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
