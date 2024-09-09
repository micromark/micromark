import assert from 'node:assert/strict'
import test from 'node:test'
import {decodeString} from 'micromark-util-decode-string'

test('decodeString', async function (t) {
  await t.test('should not decode a non-reference', async function () {
    assert.equal(decodeString('a &asd; b'), 'a &asd; b')
  })

  await t.test(
    'should properly decode dangerous references',
    async function () {
      assert.equal(decodeString('a &#0; b'), 'a � b')
    }
  )

  await t.test('should decode a named reference', async function () {
    assert.equal(decodeString('a &semi; b'), 'a ; b')
  })

  await t.test('should decode a decimal reference', async function () {
    assert.equal(decodeString('a &#59; b'), 'a ; b')
  })

  await t.test('should decode a hexadecimal reference', async function () {
    assert.equal(decodeString('a &#x3b; b'), 'a ; b')
  })

  await t.test('should not decode a non-escape', async function () {
    assert.equal(decodeString('a \\a b'), 'a \\a b')
  })

  await t.test('should decode an escape', async function () {
    assert.equal(decodeString('a \\; b'), 'a ; b')
  })

  await t.test('should decode', async function () {
    assert.equal(decodeString('a ; b'), 'a ; b')
  })

  await t.test(
    'should nout double decode an escaped reference',
    async function () {
      assert.equal(decodeString('a \\&semi; b'), 'a &semi; b')
    }
  )
})
