'use strict'

var test = require('tape')
var m = require('../../..')

test('atx-heading', function (t) {
  t.equal(
    m('# foo'),
    '<h1>foo</h1>',
    'should support a heading with a rank of 1'
  )

  t.equal(
    m('## foo'),
    '<h2>foo</h2>',
    'should support a heading with a rank of 2'
  )

  t.equal(
    m('### foo'),
    '<h3>foo</h3>',
    'should support a heading with a rank of 3'
  )

  t.equal(
    m('#### foo'),
    '<h4>foo</h4>',
    'should support a heading with a rank of 4'
  )

  t.equal(
    m('##### foo'),
    '<h5>foo</h5>',
    'should support a heading with a rank of 5'
  )

  t.equal(
    m('###### foo'),
    '<h6>foo</h6>',
    'should support a heading with a rank of 6'
  )

  t.equal(
    m('####### foo'),
    '<p>####### foo</p>',
    'should not support a heading with a rank of 7'
  )

  t.end()
})
