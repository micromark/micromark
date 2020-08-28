'use strict'

var test = require('tape')
var m = require('../../..')

test('code-fenced', function (t) {
  t.equal(
    m('```\n<\n >\n```'),
    '<pre><code>&lt;\n &gt;\n</code></pre>',
    'should support fenced code w/ grave accents'
  )

  t.equal(
    m('~~~\n<\n >\n~~~'),
    '<pre><code>&lt;\n &gt;\n</code></pre>',
    'should support fenced code w/ tildes'
  )

  t.equal(
    m('``\nfoo\n``'),
    '<p><code>foo</code></p>',
    'should not support fenced code w/ less than three markers'
  )

  t.equal(
    m('```\naaa\n~~~\n```'),
    '<pre><code>aaa\n~~~\n</code></pre>',
    'should not support a tilde closing sequence for a grave accent opening sequence'
  )

  t.equal(
    m('~~~\naaa\n```\n~~~'),
    '<pre><code>aaa\n```\n</code></pre>',
    'should not support a grave accent closing sequence for a tilde opening sequence'
  )

  t.equal(
    m('````\naaa\n```\n``````'),
    '<pre><code>aaa\n```\n</code></pre>',
    'should support a closing sequence longer, but not shorter than, the opening'
  )

  t.equal(
    m('~~~~\naaa\n~~~\n~~~~'),
    '<pre><code>aaa\n~~~\n</code></pre>',
    'should support a closing sequence equal to, but not shorter than, the opening'
  )

  t.equal(
    m('```'),
    '<pre><code></code></pre>',
    'should support an eof right after an opening sequence'
  )

  t.equal(
    m('`````\n\n```\naaa\n'),
    '<pre><code>\n```\naaa\n</code></pre>\n',
    'should support an eof somewhere in content'
  )

  t.equal(
    m('> ```\n> aaa\n\nbbb'),
    '<blockquote>\n<pre><code>aaa\n</code></pre>\n</blockquote>\n<p>bbb</p>',
    'should support no closing sequence in a block quote'
  )

  t.equal(
    m('```\n\n  \n```'),
    '<pre><code>\n  \n</code></pre>',
    'should support blank lines in fenced code'
  )

  t.equal(
    m('```\n```'),
    '<pre><code></code></pre>',
    'should support empty fenced code'
  )

  t.equal(
    m(' ```\n aaa\naaa\n```'),
    '<pre><code>aaa\naaa\n</code></pre>',
    'should remove up to one space from the content if the opening sequence is indented w/ 1 space'
  )

  t.equal(
    m('  ```\naaa\n  aaa\naaa\n  ```'),
    '<pre><code>aaa\naaa\naaa\n</code></pre>',
    'should remove up to two space from the content if the opening sequence is indented w/ 2 spaces'
  )

  t.equal(
    m('   ```\n   aaa\n    aaa\n  aaa\n   ```'),
    '<pre><code>aaa\n aaa\naaa\n</code></pre>',
    'should remove up to three space from the content if the opening sequence is indented w/ 3 spaces'
  )

  t.equal(
    m('    ```\n    aaa\n    ```'),
    '<pre><code>```\naaa\n```\n</code></pre>',
    'should not support indenteding the opening sequence w/ 4 spaces'
  )

  t.equal(
    m('```\naaa\n  ```'),
    '<pre><code>aaa\n</code></pre>',
    'should support an indented closing sequence'
  )

  t.equal(
    m('   ```\naaa\n  ```'),
    '<pre><code>aaa\n</code></pre>',
    'should support a differently indented closing sequence than the opening sequence'
  )

  t.equal(
    m('```\naaa\n    ```'),
    '<pre><code>aaa\n    ```\n</code></pre>',
    'should not support an indented closing sequence w/ 4 spaces'
  )

  t.equal(
    m('``` ```\naaa'),
    '<p><code> </code>\naaa</p>',
    'should not support grave accents in the opening fence after the opening sequence'
  )

  t.equal(
    m('~~~~~~\naaa\n~~~ ~~\n'),
    '<pre><code>aaa\n~~~ ~~\n</code></pre>\n',
    'should not support spaces in the closing sequence'
  )

  t.equal(
    m('foo\n```\nbar\n```\nbaz'),
    '<p>foo</p>\n<pre><code>bar\n</code></pre>\n<p>baz</p>',
    'should support interrupting paragraphs'
  )

  t.equal(
    m('foo\n---\n~~~\nbar\n~~~\n# baz'),
    '<h2>foo</h2>\n<pre><code>bar\n</code></pre>\n<h1>baz</h1>',
    'should support interrupting other content'
  )

  t.equal(
    m('```ruby\ndef foo(x)\n  return 3\nend\n```'),
    '<pre><code class="language-ruby">def foo(x)\n  return 3\nend\n</code></pre>',
    'should support the info string as a `language-` class (1)'
  )

  t.equal(
    m('````;\n````'),
    '<pre><code class="language-;"></code></pre>',
    'should support the info string as a `language-` class (2)'
  )

  t.equal(
    m('~~~~    ruby startline=3 $%@#$\ndef foo(x)\n  return 3\nend\n~~~~~~~'),
    '<pre><code class="language-ruby">def foo(x)\n  return 3\nend\n</code></pre>',
    'should support the info string as a `language-` class, but not the meta string'
  )

  t.equal(
    m('``` aa ```\nfoo'),
    '<p><code>aa</code>\nfoo</p>',
    'should not support grave accents in the meta string'
  )

  t.equal(
    m('~~~ aa ``` ~~~\nfoo\n~~~'),
    '<pre><code class="language-aa">foo\n</code></pre>',
    'should support grave accents and tildes in the meta string of tilde fenced code'
  )

  t.equal(
    m('```\n``` aaa\n```'),
    '<pre><code>``` aaa\n</code></pre>',
    'should not support info string on closing sequences'
  )

  // Our own:
  t.equal(
    m('```  '),
    '<pre><code></code></pre>',
    'should support an eof after whitespace, after the start fence sequence'
  )

  t.equal(
    m('```  js\nalert(1)\n```'),
    '<pre><code class="language-js">alert(1)\n</code></pre>',
    'should support whitespace between the sequence and the info string'
  )

  t.equal(
    m('```js'),
    '<pre><code class="language-js"></code></pre>',
    'should support an eof after the info string'
  )

  t.equal(
    m('```  js \nalert(1)\n```'),
    '<pre><code class="language-js">alert(1)\n</code></pre>',
    'should support whitespace after the info string'
  )

  t.equal(
    m('```\n  '),
    '<pre><code>  \n</code></pre>',
    'should support an eof after whitespace in content'
  )

  t.equal(
    m('  ```\n '),
    '<pre><code></code></pre>',
    'should support an eof in the prefix, in content'
  )

  t.equal(
    m('```j\\+s&copy;'),
    '<pre><code class="language-j+s©"></code></pre>',
    'should support character escapes and character references in info strings'
  )

  t.equal(
    m('   ```\naaa\n    ```'),
    '<pre><code>aaa\n ```\n</code></pre>',
    'should not support a closing sequence w/ too much indent, regardless of opening sequence'
  )

  t.end()
})
