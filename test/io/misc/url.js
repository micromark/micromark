import test from 'tape'
import m from '../../..'

test('url', function (t) {
  t.equal(
    m('[](<%>)'),
    '<p><a href="%25"></a></p>',
    'should support incorrect percentage encoded values (1)'
  )

  t.equal(
    m('[](<%%20>)'),
    '<p><a href="%25%20"></a></p>',
    'should support incorrect percentage encoded values (2)'
  )

  t.equal(
    m('[](<%a%20>)'),
    '<p><a href="%25a%20"></a></p>',
    'should support incorrect percentage encoded values (3)'
  )

  t.equal(
    m('[](<foo\uD800bar>)'),
    '<p><a href="foo%EF%BF%BDbar"></a></p>',
    'should support a lone high surrogate (lowest)'
  )

  t.equal(
    m('[](<foo\uDBFFbar>)'),
    '<p><a href="foo%EF%BF%BDbar"></a></p>',
    'should support a lone high surrogate (highest)'
  )

  t.equal(
    m('[](<\uD800bar>)'),
    '<p><a href="%EF%BF%BDbar"></a></p>',
    'should support a lone high surrogate at the start (lowest)'
  )

  t.equal(
    m('[](<\uDBFFbar>)'),
    '<p><a href="%EF%BF%BDbar"></a></p>',
    'should support a lone high surrogate at the start (highest)'
  )

  t.equal(
    m('[](<foo\uD800>)'),
    '<p><a href="foo%EF%BF%BD"></a></p>',
    'should support a lone high surrogate at the end (lowest)'
  )

  t.equal(
    m('[](<foo\uDBFF>)'),
    '<p><a href="foo%EF%BF%BD"></a></p>',
    'should support a lone high surrogate at the end (highest)'
  )

  t.equal(
    m('[](<foo\uDC00bar>)'),
    '<p><a href="foo%EF%BF%BDbar"></a></p>',
    'should support a lone low surrogate (lowest)'
  )

  t.equal(
    m('[](<foo\uDFFFbar>)'),
    '<p><a href="foo%EF%BF%BDbar"></a></p>',
    'should support a lone low surrogate (highest)'
  )

  t.equal(
    m('[](<\uDC00bar>)'),
    '<p><a href="%EF%BF%BDbar"></a></p>',
    'should support a lone low surrogate at the start (lowest)'
  )

  t.equal(
    m('[](<\uDFFFbar>)'),
    '<p><a href="%EF%BF%BDbar"></a></p>',
    'should support a lone low surrogate at the start (highest)'
  )

  t.equal(
    m('[](<foo\uDC00>)'),
    '<p><a href="foo%EF%BF%BD"></a></p>',
    'should support a lone low surrogate at the end (lowest)'
  )

  t.equal(
    m('[](<foo\uDFFF>)'),
    '<p><a href="foo%EF%BF%BD"></a></p>',
    'should support a lone low surrogate at the end (highest)'
  )

  t.equal(
    m('[](<🤔>)'),
    '<p><a href="%F0%9F%A4%94"></a></p>',
    'should support an emoji'
  )

  var ascii = []
  var code = -1

  while (++code < 128) {
    // LF and CR can’t be in resources.
    if (code === 10 || code === 13) {
      continue
    }

    // `<`, `>`, `\` need to be escaped.
    if (code === 60 || code === 62 || code === 92) {
      ascii.push('\\')
    }

    ascii.push(String.fromCharCode(code))
  }

  t.equal(
    m('[](<' + ascii.join('') + '>)'),
    '<p><a href="%EF%BF%BD%01%02%03%04%05%06%07%08%09%0B%0C%0E%0F%10%11%12%13%14%15%16%17%18%19%1A%1B%1C%1D%1E%1F%20!%22#$%25&amp;\'()*+,-./0123456789:;%3C=%3E?@ABCDEFGHIJKLMNOPQRSTUVWXYZ%5B%5C%5D%5E_%60abcdefghijklmnopqrstuvwxyz%7B%7C%7D~%7F"></a></p>',
    'should support ascii characters'
  )

  t.end()
})
