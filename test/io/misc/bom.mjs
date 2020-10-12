import test from 'tape'
import concat from 'concat-stream'
import m from '../../../index.js'
import s from '../../../stream.js'
import slowStream from '../../util/slow-stream.mjs'

test('bom (byte order marker)', function (t) {
  t.equal(m('\uFEFF'), '', 'should ignore just a bom')

  t.equal(
    m('\uFEFF# hea\uFEFFding'),
    '<h1>hea\uFEFFding</h1>',
    'should ignore a bom'
  )

  t.equal(m(Buffer.from('\uFEFF')), '', 'should ignore just a bom (buffer)')

  t.equal(
    m(Buffer.from('\uFEFF# hea\uFEFFding')),
    '<h1>hea\uFEFFding</h1>',
    'should ignore a bom (buffer)'
  )

  t.test('should ignore a bom (stream)', function (t) {
    t.plan(1)

    slowStream('\uFEFF# hea\uFEFFding').pipe(s()).pipe(concat(onconcat))

    function onconcat(result) {
      t.equal(result, '<h1>hea\uFEFFding</h1>', 'pass')
    }
  })

  t.test('should ignore just a bom (stream)', function (t) {
    t.plan(1)

    slowStream('\uFEFF').pipe(s()).pipe(concat(onconcat))

    function onconcat(result) {
      t.equal(result, '', 'pass')
    }
  })

  t.end()
})
