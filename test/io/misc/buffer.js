import test from 'tape'
import {buffer as micromark} from '../../../lib/micromark/index.js'

test('buffer', function (t) {
  t.equal(micromark(Buffer.from('')), '', 'should support empty buffers')

  t.equal(
    micromark(Buffer.from('<admin@example.com>')),
    '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
    'should support buffers'
  )

  t.equal(
    micromark(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii'),
    '<p>brC!vo</p>',
    'should support encoding'
  )

  t.end()
})
