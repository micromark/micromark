import assert from 'node:assert/strict'
import test from 'node:test'
import {parse, postprocess, preprocess} from 'micromark'

test('sliceSerialize', async function (t) {
  await t.test(
    'should support `sliceSerialize` on a setext heading (#1)',
    async function () {
      assert.deepEqual(parseAndSlice('Heading\n======='), [
        ['enter', 'setextHeading', 'Heading\n======='],
        ['enter', 'setextHeadingText', 'Heading'],
        ['enter', 'data', 'Heading'],
        ['exit', 'data', 'Heading'],
        ['exit', 'setextHeadingText', 'Heading'],
        ['enter', 'lineEnding', '\n'],
        ['exit', 'lineEnding', '\n'],
        ['enter', 'setextHeadingLine', '======='],
        ['enter', 'setextHeadingLineSequence', '======='],
        ['exit', 'setextHeadingLineSequence', '======='],
        ['exit', 'setextHeadingLine', '======='],
        ['exit', 'setextHeading', 'Heading\n=======']
      ])
    }
  )

  await t.test(
    'should support `sliceSerialize` on a setext heading (#2)',
    async function () {
      // This used to crash: <https://github.com/micromark/micromark/issues/131>.
      assert.deepEqual(parseAndSlice('\nHeading\n======='), [
        ['enter', 'lineEndingBlank', '\n'],
        ['exit', 'lineEndingBlank', '\n'],
        ['enter', 'setextHeading', 'Heading\n======='],
        ['enter', 'setextHeadingText', 'Heading'],
        ['enter', 'data', 'Heading'],
        ['exit', 'data', 'Heading'],
        ['exit', 'setextHeadingText', 'Heading'],
        ['enter', 'lineEnding', '\n'],
        ['exit', 'lineEnding', '\n'],
        ['enter', 'setextHeadingLine', '======='],
        ['enter', 'setextHeadingLineSequence', '======='],
        ['exit', 'setextHeadingLineSequence', '======='],
        ['exit', 'setextHeadingLine', '======='],
        ['exit', 'setextHeading', 'Heading\n=======']
      ])
    }
  )
})

/**
 * Parse `value`, get all events, call `context.sliceSerialize` on each token.
 *
 * @param {string} value
 *   Input.
 * @returns {Array<[kind: string, tokenType: string, valuee: string]>}
 *   List of event kind, token names, and serialized slices.
 */
function parseAndSlice(value) {
  const chunks = preprocess()(value, undefined, true)
  const events = postprocess(parse().document().write(chunks))
  /** @type {Array<[kind: string, tokenType: string, valuee: string]>} */
  const result = []

  for (const event of events) {
    const [kind, token, context] = event
    result.push([kind, token.type, context.sliceSerialize(token)])
  }

  return result
}
