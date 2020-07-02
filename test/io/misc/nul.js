'use strict'

var test = require('tape')
var m = require('../../..')

test('nul', function (t) {
  t.equal(
    m('asd\0asd'),
    '<p>asd�asd</p>',
    'should replace `\\0` with a replacement characters (`�`)'
  )

  t.end()
})
