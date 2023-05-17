import assert from 'node:assert/strict'
import test from 'node:test'
import {splice} from 'micromark-util-chunked'

test('splice', function () {
  /** @type {Array<number>} */
  let list = []
  const lots = [...Array.from({length: 140_000}).keys()]

  assert.throws(
    () => list.splice(0, 0, ...lots),
    'baseline: `[].slice` should crash on lots of items'
  )

  list = [5, 4, 3, 2, 1]

  splice(list, 0, 0, [])

  assert.deepEqual(
    list,
    [5, 4, 3, 2, 1],
    'should not mutate the array for no deletes, no inserts'
  )

  list = [5, 4, 3, 2, 1]

  splice(list, 1, 2, [9, 99, 999])

  assert.deepEqual(
    list,
    [5, 9, 99, 999, 2, 1],
    'should mutatefor deletes, inserts'
  )

  list = [5, 4, 3, 2, 1]

  splice(list, -3, 2, [9, 99, 999])

  assert.deepEqual(
    list,
    [5, 4, 9, 99, 999, 1],
    'should mutate the list w/ a negative start'
  )

  splice(list, 100, 3, [10, 11, 12])

  assert.deepEqual(
    list,
    [5, 4, 9, 99, 999, 1, 10, 11, 12],
    'should delete items for a too big start'
  )

  splice(list, -100, 3, [6])

  assert.deepEqual(
    list,
    [6, 99, 999, 1, 10, 11, 12],
    'should delete items w/ a negative start'
  )

  list = [42, 10, 11, 12, 13, 43]

  splice(list, 1, 0, lots)

  assert.deepEqual(
    list,
    [42, ...lots, 10, 11, 12, 13, 43],
    'should handle lots of inserts just fine'
  )

  list = [42, 10, 11, 12, 13, 43]

  splice(list, 1, 4, lots)

  assert.deepEqual(
    list,
    [42, ...lots, 43],
    'should remove and still handle lots of inserts just fine'
  )
})
