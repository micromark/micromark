import assert from 'node:assert/strict'
import test from 'node:test'
import concatStream from 'concat-stream'
import {micromark} from 'micromark'
import {stream} from 'micromark/stream'
import {slowStream} from '../../util/slow-stream.js'

test('bom (byte order marker)', async function () {
  assert.equal(micromark('\uFEFF'), '', 'should ignore just a bom')

  assert.equal(
    micromark('\uFEFF# hea\uFEFFding'),
    '<h1>hea\uFEFFding</h1>',
    'should ignore a bom'
  )

  assert.equal(
    micromark(new TextEncoder().encode('\uFEFF')),
    '',
    'should ignore just a bom (typed array)'
  )

  assert.equal(
    micromark(new TextEncoder().encode('\uFEFF# hea\uFEFFding')),
    '<h1>hea\uFEFFding</h1>',
    'should ignore a bom (typed array)'
  )

  await new Promise(function (resolve) {
    slowStream('\uFEFF# hea\uFEFFding')
      .pipe(stream())
      .pipe(
        concatStream((result) => {
          // Note: `TextDecoder` removes the internal BOM.
          assert.equal(
            result,
            '<h1>heading</h1>',
            'should ignore a bom (stream)'
          )

          resolve(undefined)
        })
      )
  })

  await new Promise(function (resolve) {
    slowStream('\uFEFF')
      .pipe(stream())
      .pipe(
        concatStream((result) => {
          assert.equal(result, '', 'should ignore just a bom (stream)')

          resolve(undefined)
        })
      )
  })
})
