import assert from 'node:assert/strict'
import test from 'node:test'
import {SpliceBuffer} from 'micromark-util-subtokenize'

test('SpliceBuffer', async function (t) {
  await t.test('should splice on an empty buffer', async function () {
    /** @type {SpliceBuffer<bigint>} */
    const buffer = new SpliceBuffer()
    assert.deepEqual(buffer.splice(0), [])
  })

  await t.test(
    'should throw when getting an impossible slice',
    async function () {
      /** @type {SpliceBuffer<bigint>} */
      const buffer = new SpliceBuffer()

      assert.throws(function () {
        buffer.get(0)
      }, /Cannot access index `0` in a splice buffer of size `0`/)
    }
  )

  await t.test('should return what’s removed from `splice`', async function () {
    /** @type {SpliceBuffer<bigint>} */
    const buffer = new SpliceBuffer()

    assert.deepEqual(buffer.splice(0, 0, [2n, 4n]), [])
  })

  await t.test('should return injected splices', async function () {
    /** @type {SpliceBuffer<bigint>} */
    const buffer = new SpliceBuffer()
    buffer.splice(0, 0, [2n, 4n])
    assert.deepEqual(buffer.slice(0, 1), [2n])
  })

  await t.test('should work', async function () {
    const sb = new SpliceBuffer(['a', 'b', 'c', 'd'])
    assert.deepEqual(sb.slice(0), ['a', 'b', 'c', 'd'])
    assert.equal(sb.length, 4)
    sb.push('7')
    assert.equal(sb.length, 5)
    sb.pushMany(['8', '9'])
    assert.equal(sb.length, 7)
    sb.unshift('3')
    assert.equal(sb.length, 8)
    sb.unshiftMany(['1', '2'])
    assert.equal(sb.length, 10)
    assert.deepEqual(sb.splice(4, 2, ['x']), ['b', 'c'])
    assert.equal(sb.length, 9)
    assert.deepEqual(sb.slice(0), ['1', '2', '3', 'a', 'x', 'd', '7', '8', '9'])
    assert.deepEqual(sb.slice(1, 3), ['2', '3'])
    assert.deepEqual(sb.slice(3, 6), ['a', 'x', 'd'])
    assert.deepEqual(sb.slice(6, 8), ['7', '8'])
    assert.deepEqual(sb.slice(3), ['a', 'x', 'd', '7', '8', '9'])
    assert.deepEqual(sb.slice(4), ['x', 'd', '7', '8', '9'])
    assert.deepEqual(sb.slice(5), ['d', '7', '8', '9'])
    assert.deepEqual(sb.slice(6), ['7', '8', '9'])
    assert.equal(sb.pop(), '9')
    assert.equal(sb.shift(), '1')
    assert.deepEqual(sb.splice(2, Number.POSITIVE_INFINITY), [
      'a',
      'x',
      'd',
      '7',
      '8'
    ])
    assert.equal(sb.pop(), '3')
    assert.equal(sb.shift(), '2')
    assert.equal(sb.pop(), undefined)
    assert.equal(sb.shift(), undefined)
    assert.deepEqual(sb.splice(-100, 100, ['hi', 'there']), [])
    assert.equal(sb.get(0), 'hi')
    assert.equal(sb.get(1), 'there')
    assert.throws(function () {
      sb.get(-1)
    }, /Cannot access index `-1` in a splice buffer of size `2`/)
    assert.throws(function () {
      sb.get(2)
    }, /Cannot access index `2` in a splice buffer of size `2`/)
    const lots = [...Array.from({length: 140_000}).keys()].map(function (x) {
      return x.toString()
    })
    assert.deepEqual(sb.splice(1, 0, lots), [])
    assert.deepEqual(sb.slice(0, 2), ['hi', '0'])
    assert.deepEqual(sb.slice(140_000), ['139999', 'there'])
  })
})
