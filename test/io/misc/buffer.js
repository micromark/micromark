import assert from 'node:assert/strict'
import test from 'node:test'
import {Buffer} from 'node:buffer'
import {micromark} from 'micromark'

test('buffer', function () {
  assert.equal(micromark(Buffer.from('')), '', 'should support empty buffers')

  assert.equal(
    micromark(Buffer.from('<admin@example.com>')),
    '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
    'should support buffers'
  )

  assert.equal(
    micromark(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii'),
    '<p>brC!vo</p>',
    'should support encoding'
  )
})
