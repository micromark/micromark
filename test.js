'use strict'

var test = require('tape')
var m = require('.')

test('mm', function (t) {
  t.equal(typeof m, 'function', 'issa function')
  t.end()
})
