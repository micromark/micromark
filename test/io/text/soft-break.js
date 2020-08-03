'use strict'

var test = require('tape')
var m = require('../../..')

test('soft-break', function (t) {
  t.equal(m('foo\nbaz'), '<p>foo\nbaz</p>', 'should support line endings')

  t.equal(
    m('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should trim spaces around line endings'
  )

  t.end()
})
