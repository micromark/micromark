import test from 'tape'
import m from '../../..'

test('dangerous-html', function (t) {
  t.equal(m('<x>'), '&lt;x&gt;', 'should be safe by default for flow')

  t.equal(m('a<b>'), '<p>a&lt;b&gt;</p>', 'should be safe by default for text')

  t.equal(
    m('<x>', {allowDangerousHtml: true}),
    '<x>',
    'should be unsafe w/ `allowDangerousHtml`'
  )

  t.end()
})
