import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('dangerous-html', function () {
  assert.equal(
    micromark('<x>'),
    '&lt;x&gt;',
    'should be safe by default for flow'
  )

  assert.equal(
    micromark('a<b>'),
    '<p>a&lt;b&gt;</p>',
    'should be safe by default for text'
  )

  assert.equal(
    micromark('<x>', {allowDangerousHtml: true}),
    '<x>',
    'should be unsafe w/ `allowDangerousHtml`'
  )
})
