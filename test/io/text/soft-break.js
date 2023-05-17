import {micromark} from 'micromark'
import test from 'tape'

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
