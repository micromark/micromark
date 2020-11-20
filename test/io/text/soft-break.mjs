import test from 'tape'
import m from '../../../index.mjs'

test('soft-break', function (t) {
  t.equal(m('foo\nbaz'), '<p>foo\nbaz</p>', 'should support line endings')

  t.equal(
    m('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should trim spaces around line endings'
  )

  t.end()
})
