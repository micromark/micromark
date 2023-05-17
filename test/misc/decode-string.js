import assert from 'node:assert/strict'
import test from 'node:test'
import {decodeString} from 'micromark-util-decode-string'

test('decodeString', function () {
  assert.equal(
    decodeString('a &asd; b'),
    'a &asd; b',
    'should not decode a non-reference'
  )
  assert.equal(
    decodeString('a &#0; b'),
    'a � b',
    'should properly decode dangerous references'
  )
  assert.equal(
    decodeString('a &semi; b'),
    'a ; b',
    'should decode a named reference'
  )
  assert.equal(
    decodeString('a &#59; b'),
    'a ; b',
    'should decode a decimal reference'
  )
  assert.equal(
    decodeString('a &#x3b; b'),
    'a ; b',
    'should decode a hexadecimal reference'
  )
  assert.equal(
    decodeString('a \\a b'),
    'a \\a b',
    'should not decode a non-escape'
  )
  assert.equal(decodeString('a \\; b'), 'a ; b', 'should decode an escape')
  assert.equal(decodeString('a ; b'), 'a ; b', 'should decode')
  assert.equal(
    decodeString('a \\&semi; b'),
    'a &semi; b',
    'should nout double decode an escaped reference'
  )
})
