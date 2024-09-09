import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('code-fenced', async function (t) {
  await t.test(
    'should support fenced code w/ grave accents',
    async function () {
      assert.equal(
        micromark('```\n<\n >\n```'),
        '<pre><code>&lt;\n &gt;\n</code></pre>'
      )
    }
  )

  await t.test('should support fenced code w/ tildes', async function () {
    assert.equal(
      micromark('~~~\n<\n >\n~~~'),
      '<pre><code>&lt;\n &gt;\n</code></pre>'
    )
  })

  await t.test(
    'should not support fenced code w/ less than three markers',
    async function () {
      assert.equal(micromark('``\nfoo\n``'), '<p><code>foo</code></p>')
    }
  )

  await t.test(
    'should not support a tilde closing sequence for a grave accent opening sequence',
    async function () {
      assert.equal(
        micromark('```\naaa\n~~~\n```'),
        '<pre><code>aaa\n~~~\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support a grave accent closing sequence for a tilde opening sequence',
    async function () {
      assert.equal(
        micromark('~~~\naaa\n```\n~~~'),
        '<pre><code>aaa\n```\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support a closing sequence longer, but not shorter than, the opening',
    async function () {
      assert.equal(
        micromark('````\naaa\n```\n``````'),
        '<pre><code>aaa\n```\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support a closing sequence equal to, but not shorter than, the opening',
    async function () {
      assert.equal(
        micromark('~~~~\naaa\n~~~\n~~~~'),
        '<pre><code>aaa\n~~~\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support an eof right after an opening sequence',
    async function () {
      assert.equal(micromark('```'), '<pre><code></code></pre>\n')
    }
  )

  await t.test('should support an eof somewhere in content', async function () {
    assert.equal(
      micromark('`````\n\n```\naaa\n'),
      '<pre><code>\n```\naaa\n</code></pre>\n'
    )
  })

  await t.test(
    'should support no closing sequence in a block quote',
    async function () {
      assert.equal(
        micromark('> ```\n> aaa\n\nbbb'),
        '<blockquote>\n<pre><code>aaa\n</code></pre>\n</blockquote>\n<p>bbb</p>'
      )
    }
  )

  await t.test('should support blank lines in fenced code', async function () {
    assert.equal(micromark('```\n\n  \n```'), '<pre><code>\n  \n</code></pre>')
  })

  await t.test('should support empty fenced code', async function () {
    assert.equal(micromark('```\n```'), '<pre><code></code></pre>')
  })

  await t.test(
    'should remove up to one space from the content if the opening sequence is indented w/ 1 space',
    async function () {
      assert.equal(
        micromark(' ```\n aaa\naaa\n```'),
        '<pre><code>aaa\naaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should remove up to two space from the content if the opening sequence is indented w/ 2 spaces',
    async function () {
      assert.equal(
        micromark('  ```\naaa\n  aaa\naaa\n  ```'),
        '<pre><code>aaa\naaa\naaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should remove up to three space from the content if the opening sequence is indented w/ 3 spaces',
    async function () {
      assert.equal(
        micromark('   ```\n   aaa\n    aaa\n  aaa\n   ```'),
        '<pre><code>aaa\n aaa\naaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support indenteding the opening sequence w/ 4 spaces',
    async function () {
      assert.equal(
        micromark('    ```\n    aaa\n    ```'),
        '<pre><code>```\naaa\n```\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support an indented closing sequence',
    async function () {
      assert.equal(
        micromark('```\naaa\n  ```'),
        '<pre><code>aaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support a differently indented closing sequence than the opening sequence',
    async function () {
      assert.equal(
        micromark('   ```\naaa\n  ```'),
        '<pre><code>aaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support an indented closing sequence w/ 4 spaces',
    async function () {
      assert.equal(
        micromark('```\naaa\n    ```\n'),
        '<pre><code>aaa\n    ```\n</code></pre>\n'
      )
    }
  )

  await t.test(
    'should not support grave accents in the opening fence after the opening sequence',
    async function () {
      assert.equal(micromark('``` ```\naaa'), '<p><code> </code>\naaa</p>')
    }
  )

  await t.test(
    'should not support spaces in the closing sequence',
    async function () {
      assert.equal(
        micromark('~~~~~~\naaa\n~~~ ~~\n'),
        '<pre><code>aaa\n~~~ ~~\n</code></pre>\n'
      )
    }
  )

  await t.test('should support interrupting paragraphs', async function () {
    assert.equal(
      micromark('foo\n```\nbar\n```\nbaz'),
      '<p>foo</p>\n<pre><code>bar\n</code></pre>\n<p>baz</p>'
    )
  })

  await t.test('should support interrupting other content', async function () {
    assert.equal(
      micromark('foo\n---\n~~~\nbar\n~~~\n# baz'),
      '<h2>foo</h2>\n<pre><code>bar\n</code></pre>\n<h1>baz</h1>'
    )
  })

  await t.test(
    'should support the info string as a `language-` class (1)',
    async function () {
      assert.equal(
        micromark('```ruby\ndef foo(x)\n  return 3\nend\n```'),
        '<pre><code class="language-ruby">def foo(x)\n  return 3\nend\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support the info string as a `language-` class (2)',
    async function () {
      assert.equal(
        micromark('````;\n````'),
        '<pre><code class="language-;"></code></pre>'
      )
    }
  )

  await t.test(
    'should support the info string as a `language-` class, but not the meta string',
    async function () {
      assert.equal(
        micromark(
          '~~~~    ruby startline=3 $%@#$\ndef foo(x)\n  return 3\nend\n~~~~~~~'
        ),
        '<pre><code class="language-ruby">def foo(x)\n  return 3\nend\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support grave accents in the meta string',
    async function () {
      assert.equal(micromark('``` aa ```\nfoo'), '<p><code>aa</code>\nfoo</p>')
    }
  )

  await t.test(
    'should support grave accents and tildes in the meta string of tilde fenced code',
    async function () {
      assert.equal(
        micromark('~~~ aa ``` ~~~\nfoo\n~~~'),
        '<pre><code class="language-aa">foo\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support info string on closing sequences',
    async function () {
      assert.equal(
        micromark('```\n``` aaa\n```'),
        '<pre><code>``` aaa\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support an eof after whitespace, after the start fence sequence',
    async function () {
      // Our own:
      assert.equal(micromark('```  '), '<pre><code></code></pre>\n')
    }
  )

  await t.test(
    'should support whitespace between the sequence and the info string',
    async function () {
      assert.equal(
        micromark('```  js\nalert(1)\n```'),
        '<pre><code class="language-js">alert(1)\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support an eof after the info string',
    async function () {
      assert.equal(
        micromark('```js'),
        '<pre><code class="language-js"></code></pre>\n'
      )
    }
  )

  await t.test(
    'should support whitespace after the info string',
    async function () {
      assert.equal(
        micromark('```  js \nalert(1)\n```'),
        '<pre><code class="language-js">alert(1)\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support an eof after whitespace in content',
    async function () {
      assert.equal(micromark('```\n  '), '<pre><code>  \n</code></pre>\n')
    }
  )

  await t.test(
    'should support an eof in the prefix, in content',
    async function () {
      assert.equal(micromark('  ```\n '), '<pre><code></code></pre>\n')
    }
  )

  await t.test(
    'should support character escapes and character references in info strings',
    async function () {
      assert.equal(
        micromark('```j\\+s&copy;'),
        '<pre><code class="language-j+s©"></code></pre>\n'
      )
    }
  )

  await t.test(
    'should not support a closing sequence w/ too much indent, regardless of opening sequence (1)',
    async function () {
      assert.equal(
        micromark('   ```\naaa\n    ```'),
        '<pre><code>aaa\n ```\n</code></pre>\n'
      )
    }
  )

  await t.test(
    'should not support a closing sequence w/ too much indent, regardless of opening sequence (2)',
    async function () {
      assert.equal(
        micromark('> ```\n>\n>\n>\n\na'),
        '<blockquote>\n<pre><code>\n\n\n</code></pre>\n</blockquote>\n<p>a</p>'
      )
    }
  )

  await t.test('should not support lazyness (1)', async function () {
    assert.equal(
      micromark('> ```a\nb'),
      '<blockquote>\n<pre><code class="language-a"></code></pre>\n</blockquote>\n<p>b</p>'
    )
  })

  await t.test('should not support lazyness (2)', async function () {
    assert.equal(
      micromark('> a\n```b'),
      '<blockquote>\n<p>a</p>\n</blockquote>\n<pre><code class="language-b"></code></pre>\n'
    )
  })

  await t.test('should not support lazyness (3)', async function () {
    assert.equal(
      micromark('> ```a\n```'),
      '<blockquote>\n<pre><code class="language-a"></code></pre>\n</blockquote>\n<pre><code></code></pre>\n'
    )
  })

  await t.test('should support turning off code (fenced)', async function () {
    assert.equal(
      micromark('```', {extensions: [{disable: {null: ['codeFenced']}}]}),
      '<p>```</p>'
    )
  })
})
