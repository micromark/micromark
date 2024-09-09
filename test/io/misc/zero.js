import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

// Note: `nul` doesn’t work on Windows as a file name 🤷‍♂️
test('nul', async function (t) {
  await t.test(
    'should replace `\\0` w/ a replacement characters (`�`)',
    async function () {
      assert.equal(
        micromark('asd\0asd'),
        // Note: this long comment has to be here because otherwise TypeScript crashes.
        // It doesn’t accept the actual `\uFFFD` character in the first 256 characters.
        // See: microsoft/TypeScript#57930.
        '<p>asd�asd</p>'
      )
    }
  )

  await t.test(
    'should replace NUL in a character reference',
    async function () {
      assert.equal(micromark('&#0;'), '<p>�</p>')
    }
  )

  await t.test(
    'should not support NUL in a character escape',
    async function () {
      // This doesn’t make sense in MD, as character escapes only work on ascii
      // punctuation, but it’s good to demonstrate the behavior.
      assert.equal(micromark('\\0'), '<p>\\0</p>')
    }
  )
})
