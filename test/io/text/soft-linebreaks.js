'use strict'

var test = require('tape')
var m = require('../../..')

test('soft linebreaks', function (t) {
  t.equal(m('foo\nbaz'), '<p>foo\nbaz</p>', 'should support soft breaks')

  t.equal(
    m('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should collapse spaces around line endings'
  )

  t.end()
})
