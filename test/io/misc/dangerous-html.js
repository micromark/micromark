import test from 'tape'
import {buffer as micromark} from '../../../lib/index.js'

test('dangerous-html', function (t) {
  t.equal(micromark('<x>'), '&lt;x&gt;', 'should be safe by default for flow')

  t.equal(
    micromark('a<b>'),
    '<p>a&lt;b&gt;</p>',
    'should be safe by default for text'
  )

  t.equal(
    micromark('<x>', {allowDangerousHtml: true}),
    '<x>',
    'should be unsafe w/ `allowDangerousHtml`'
  )

  t.end()
})
