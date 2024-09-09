import assert from 'node:assert/strict'
import test from 'node:test'
import concatStream from 'concat-stream'
import {stream} from 'micromark/stream'
import {micromark} from 'micromark'
import {slowStream} from '../../util/slow-stream.js'

test('bom (byte order marker)', async function (t) {
  await t.test('should ignore just a bom', async function () {
    assert.equal(micromark('\uFEFF'), '')
  })

  await t.test('should ignore a bom', async function () {
    assert.equal(micromark('\uFEFF# hea\uFEFFding'), '<h1>hea\uFEFFding</h1>')
  })

  await t.test('should ignore just a bom (typed array)', async function () {
    assert.equal(micromark(new TextEncoder().encode('\uFEFF')), '')
  })

  await t.test('should ignore a bom (typed array)', async function () {
    assert.equal(
      micromark(new TextEncoder().encode('\uFEFF# hea\uFEFFding')),
      '<h1>hea\uFEFFding</h1>'
    )
  })

  await t.test('should ignore a bom (stream)', async function () {
    await new Promise(function (resolve) {
      slowStream('\uFEFF# hea\uFEFFding')
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
            // Note: `TextDecoder` removes the internal BOM.
            assert.equal(result, '<h1>heading</h1>')
            resolve(undefined)
          })
        )
    })
  })

  await t.test('should ignore just a bom (stream)', async function () {
    await new Promise(function (resolve) {
      slowStream('\uFEFF')
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '')

            resolve(undefined)
          })
        )
    })
  })
})
