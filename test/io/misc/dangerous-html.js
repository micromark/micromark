import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('dangerous-html', async function (t) {
  await t.test('should be safe by default for flow', async function () {
    assert.equal(micromark('<x>'), '&lt;x&gt;')
  })

  await t.test('should be safe by default for text', async function () {
    assert.equal(micromark('a<b>'), '<p>a&lt;b&gt;</p>')
  })

  await t.test('should be unsafe w/ `allowDangerousHtml`', async function () {
    assert.equal(micromark('<x>', {allowDangerousHtml: true}), '<x>')
  })
})
