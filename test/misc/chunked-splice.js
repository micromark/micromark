import assert from 'node:assert/strict'
import test from 'node:test'
import {splice} from 'micromark-util-chunked'

test('splice', async function (t) {
  const lots = [...Array.from({length: 140_000}).keys()]

  await t.test(
    'baseline: `[].slice` should crash on lots of items',
    async function () {
      /** @type {Array<number>} */
      const list = []

      assert.throws(function () {
        list.splice(0, 0, ...lots)
      })
    }
  )

  await t.test(
    'should not mutate the array for no deletes, no inserts',
    async function () {
      const list = [5, 4, 3, 2, 1]

      splice(list, 0, 0, [])

      assert.deepEqual(list, [5, 4, 3, 2, 1])
    }
  )

  await t.test('should mutatefor deletes, inserts', async function () {
    const list = [5, 4, 3, 2, 1]

    splice(list, 1, 2, [9, 99, 999])

    assert.deepEqual(list, [5, 9, 99, 999, 2, 1])
  })

  await t.test('should mutate the list w/ a negative start', async function () {
    const list = [5, 4, 3, 2, 1]

    splice(list, -3, 2, [9, 99, 999])

    assert.deepEqual(list, [5, 4, 9, 99, 999, 1])
  })

  await t.test('should delete items for a too big start', async function () {
    const list = [5, 4, 9, 99, 999, 1]

    splice(list, 100, 3, [10, 11, 12])

    assert.deepEqual(list, [5, 4, 9, 99, 999, 1, 10, 11, 12])
  })

  await t.test('should delete items w/ a negative start', async function () {
    const list = [5, 4, 9, 99, 999, 1, 10, 11, 12]
    splice(list, -100, 3, [6])

    assert.deepEqual(list, [6, 99, 999, 1, 10, 11, 12])
  })

  await t.test('should handle lots of inserts just fine', async function () {
    const list = [42, 10, 11, 12, 13, 43]

    splice(list, 1, 0, lots)

    assert.deepEqual(list, [42, ...lots, 10, 11, 12, 13, 43])
  })

  await t.test(
    'should remove and still handle lots of inserts just fine',
    async function () {
      const list = [42, 10, 11, 12, 13, 43]

      splice(list, 1, 4, lots)

      assert.deepEqual(list, [42, ...lots, 43])
    }
  )
})
