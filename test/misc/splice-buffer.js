import assert from 'node:assert/strict'
import test from 'node:test'
import {spliceBuffer} from 'micromark-util-subtokenize/splice-buffer'

test('spliceBuffer', function () {
  const sb = spliceBuffer(['a', 'b', 'c', 'd'])

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
  assert.throws(() => sb.get(-1), 'RangeError: index -1 in a buffer of size 2')
  assert.throws(() => sb.get(2), 'RangeError: index 2 in a buffer of size 2')
})
