import test from 'tape'
import chunkedSplice from '../../dist/util/chunked-splice.js'

test('chunkedSplice', function (t) {
  t.test('Zero delete zero insert', function (t) {
    t.plan(2)

    var array = [5, 4, 3, 2, 1]
    t.deepEqual(
      chunkedSplice(array, 0, 0, []),
      [],
      'should keep the array as it is'
    )
    t.deepEqual(array, [5, 4, 3, 2, 1], 'should not mutate the array')

    t.end()
  })

  t.test('Delete and insert', function (t) {
    t.plan(2)

    var array = [5, 4, 3, 2, 1]

    t.deepEqual(
      chunkedSplice(array, 1, 2, [9, 99, 999]),
      [4, 3],
      'should return deleted items'
    )

    t.deepEqual(array, [5, 9, 99, 999, 2, 1], 'should mutate the array')

    t.end()
  })

  t.test('Edge cases', function (t) {
    t.plan(6)

    var array = [5, 4, 3, 2, 1]

    t.deepEqual(
      chunkedSplice(array, -3, 2, [9, 99, 999]),
      [3, 2],
      'should return deleted items'
    )

    t.deepEqual(array, [5, 4, 9, 99, 999, 1], 'should mutate the array')

    t.deepEqual(
      chunkedSplice(array, 100, 3, [10, 11, 12]),
      [],
      'should not delete any item'
    )

    t.deepEqual(
      array,
      [5, 4, 9, 99, 999, 1, 10, 11, 12],
      'should mutate the array'
    )

    t.deepEqual(
      chunkedSplice(array, -100, 3, [6]),
      [5, 4, 9],
      'should delete items at the begining'
    )

    t.deepEqual(array, [6, 99, 999, 1, 10, 11, 12], 'should mutate the array')

    t.end()
  })

  t.test('Handle large items to insert', function (t) {
    t.plan(3)

    t.throws(
      () => [].splice(0, 0, ...new Array(140000).fill('_')),
      'regular Array#chunkedSplice cannot handle large items to insert'
    )

    var array = [42, 10, 11, 12, 13, 43]
    var itemsToInsert = [...new Array(140000).keys()]

    t.deepEqual(
      chunkedSplice(array, 1, 4, itemsToInsert),
      [10, 11, 12, 13],
      'can handle large items to insert just fine'
    )

    t.deepEqual(array, [42, ...itemsToInsert, 43])

    t.end()
  })

  t.end()
})
