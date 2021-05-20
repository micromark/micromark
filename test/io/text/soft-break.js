import test from 'tape'
import {buffer as micromark} from '../../../lib/micromark/index.js'

test('soft-break', function (t) {
  t.equal(
    micromark('foo\nbaz'),
    '<p>foo\nbaz</p>',
    'should support line endings'
  )

  t.equal(
    micromark('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should trim spaces around line endings'
  )

  t.end()
})
