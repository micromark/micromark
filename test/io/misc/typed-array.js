import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('typed-array', function () {
  assert.equal(
    micromark(new Uint8Array()),
    '',
    'should support empty typed arrays'
  )

  assert.equal(
    micromark(new TextEncoder().encode('<admin@example.com>')),
    '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
    'should support typed arrays'
  )

  assert.equal(
    micromark(
      new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00]),
      'utf-16le'
    ),
    '<p>abc</p>',
    'should support encoding'
  )
})
