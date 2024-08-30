import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('list-item', function () {
  assert.equal(
    micromark(
      'A paragraph\nwith two lines.\n\n    indented code\n\n> A block quote.'
    ),
    '<p>A paragraph\nwith two lines.</p>\n<pre><code>indented code\n</code></pre>\n<blockquote>\n<p>A block quote.</p>\n</blockquote>',
    'should support documents'
  )

  assert.equal(
    micromark('1.  a\n    b.\n\n        c\n\n    > d.'),
    '<ol>\n<li>\n<p>a\nb.</p>\n<pre><code>c\n</code></pre>\n<blockquote>\n<p>d.</p>\n</blockquote>\n</li>\n</ol>',
    'should support documents in list items'
  )

  assert.equal(
    micromark('1. a\n\n    * b'),
    '<ol>\n<li>\n<p>a</p>\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ol>',
    'should not misidentify documents in list items (1) (correct)'
  )

  assert.equal(
    micromark('1.   a\n\n    * b'),
    '<ol>\n<li>\n<p>a</p>\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ol>',
    'should not misidentify documents in list items (1)'
  )

  assert.equal(
    micromark('10.  a\n\n    * b'),
    '<ol start="10">\n<li>\n<p>a</p>\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ol>',
    'should not misidentify documents in list items (2)'
  )

  assert.equal(
    micromark('100. a\n\n    * b'),
    '<ol start="100">\n<li>\n<p>a</p>\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ol>',
    'should not misidentify documents in list items (3)'
  )

  assert.equal(
    micromark('- one\n\n two'),
    '<ul>\n<li>one</li>\n</ul>\n<p>two</p>',
    'should not support 1 space for a two-character list prefix'
  )

  assert.equal(
    micromark('- a\n\n  b'),
    '<ul>\n<li>\n<p>a</p>\n<p>b</p>\n</li>\n</ul>',
    'should support blank lines in list items'
  )

  assert.equal(
    micromark(' -    one\n\n     two'),
    '<ul>\n<li>one</li>\n</ul>\n<pre><code> two\n</code></pre>',
    'should support indented code after lists'
  )

  assert.equal(
    micromark('   > > 1.  one\n>>\n>>     two'),
    '<blockquote>\n<blockquote>\n<ol>\n<li>\n<p>one</p>\n<p>two</p>\n</li>\n</ol>\n</blockquote>\n</blockquote>',
    'should support proper indent mixed w/ block quotes (1)'
  )

  assert.equal(
    micromark('>>- one\n>>\n  >  > two'),
    '<blockquote>\n<blockquote>\n<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n</blockquote>\n</blockquote>',
    'should support proper indent mixed w/ block quotes (2)'
  )

  assert.equal(
    micromark('-one\n\n2.two'),
    '<p>-one</p>\n<p>2.two</p>',
    'should not support a missing space after marker'
  )

  assert.equal(
    micromark('- foo\n\n\n  bar'),
    '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>',
    'should support multiple blank lines between items'
  )

  assert.equal(
    micromark('1.  foo\n\n    ```\n    bar\n    ```\n\n    baz\n\n    > bam'),
    '<ol>\n<li>\n<p>foo</p>\n<pre><code>bar\n</code></pre>\n<p>baz</p>\n<blockquote>\n<p>bam</p>\n</blockquote>\n</li>\n</ol>',
    'should support flow in items'
  )

  assert.equal(
    micromark('- Foo\n\n      bar\n\n\n      baz'),
    '<ul>\n<li>\n<p>Foo</p>\n<pre><code>bar\n\n\nbaz\n</code></pre>\n</li>\n</ul>',
    'should support blank lines in indented code in items'
  )

  assert.equal(
    micromark('123456789. ok'),
    '<ol start="123456789">\n<li>ok</li>\n</ol>',
    'should support start on the first list item'
  )

  assert.equal(
    micromark('1234567890. not ok'),
    '<p>1234567890. not ok</p>',
    'should not support ordered item values over 10 digits'
  )

  assert.equal(
    micromark('0. ok'),
    '<ol start="0">\n<li>ok</li>\n</ol>',
    'should support ordered item values of `0`'
  )

  assert.equal(
    micromark('003. ok'),
    '<ol start="3">\n<li>ok</li>\n</ol>',
    'should support ordered item values starting w/ `0`s'
  )

  assert.equal(
    micromark('-1. not ok'),
    '<p>-1. not ok</p>',
    'should not support “negative” ordered item values'
  )

  assert.equal(
    micromark('- foo\n\n      bar'),
    '<ul>\n<li>\n<p>foo</p>\n<pre><code>bar\n</code></pre>\n</li>\n</ul>',
    'should support indented code in list items (1)'
  )

  assert.equal(
    micromark('  10.  foo\n\n           bar'),
    '<ol start="10">\n<li>\n<p>foo</p>\n<pre><code>bar\n</code></pre>\n</li>\n</ol>',
    'should support indented code in list items (2)'
  )

  assert.equal(
    micromark('    indented code\n\nparagraph\n\n    more code'),
    '<pre><code>indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>',
    'should support indented code in list items (3)'
  )

  assert.equal(
    micromark('1.     indented code\n\n   paragraph\n\n       more code'),
    '<ol>\n<li>\n<pre><code>indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>\n</li>\n</ol>',
    'should support indented code in list items (4)'
  )

  assert.equal(
    micromark('1.      indented code\n\n   paragraph\n\n       more code'),
    '<ol>\n<li>\n<pre><code> indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>\n</li>\n</ol>',
    'should support indented code in list items (5)'
  )

  assert.equal(
    micromark('   foo\n\nbar'),
    '<p>foo</p>\n<p>bar</p>',
    'should support indented code in list items (6)'
  )

  assert.equal(
    micromark('-    foo\n\n  bar'),
    '<ul>\n<li>foo</li>\n</ul>\n<p>bar</p>',
    'should support indented code in list items (7)'
  )

  assert.equal(
    micromark('-  foo\n\n   bar'),
    '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>',
    'should support indented code in list items (8)'
  )

  assert.equal(
    micromark('-\n  foo\n-\n  ```\n  bar\n  ```\n-\n      baz'),
    '<ul>\n<li>foo</li>\n<li>\n<pre><code>bar\n</code></pre>\n</li>\n<li>\n<pre><code>baz\n</code></pre>\n</li>\n</ul>',
    'should support blank first lines (1)'
  )

  assert.equal(
    micromark('-   \n  foo'),
    '<ul>\n<li>foo</li>\n</ul>',
    'should support blank first lines (2)'
  )

  assert.equal(
    micromark('-\n\n  foo'),
    '<ul>\n<li></li>\n</ul>\n<p>foo</p>',
    'should support empty only items'
  )

  assert.equal(
    micromark('- foo\n-\n- bar'),
    '<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>',
    'should support empty continued items'
  )

  assert.equal(
    micromark('- foo\n-   \n- bar'),
    '<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>',
    'should support blank continued items'
  )

  assert.equal(
    micromark('1. foo\n2.\n3. bar'),
    '<ol>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ol>',
    'should support empty continued items (ordered)'
  )

  assert.equal(
    micromark('*'),
    '<ul>\n<li></li>\n</ul>',
    'should support a single empty item'
  )

  assert.equal(
    micromark('foo\n*\n\nfoo\n1.'),
    '<p>foo\n*</p>\n<p>foo\n1.</p>',
    'should not support empty items to interrupt paragraphs'
  )

  assert.equal(
    micromark(
      ' 1.  A paragraph\n     with two lines.\n\n         indented code\n\n     > A block quote.'
    ),
    '<ol>\n<li>\n<p>A paragraph\nwith two lines.</p>\n<pre><code>indented code\n</code></pre>\n<blockquote>\n<p>A block quote.</p>\n</blockquote>\n</li>\n</ol>',
    'should support indenting w/ 1 space'
  )

  assert.equal(
    micromark(
      '  1.  A paragraph\n      with two lines.\n\n          indented code\n\n      > A block quote.'
    ),
    '<ol>\n<li>\n<p>A paragraph\nwith two lines.</p>\n<pre><code>indented code\n</code></pre>\n<blockquote>\n<p>A block quote.</p>\n</blockquote>\n</li>\n</ol>',
    'should support indenting w/ 2 spaces'
  )

  assert.equal(
    micromark(
      '   1.  A paragraph\n       with two lines.\n\n           indented code\n\n       > A block quote.'
    ),
    '<ol>\n<li>\n<p>A paragraph\nwith two lines.</p>\n<pre><code>indented code\n</code></pre>\n<blockquote>\n<p>A block quote.</p>\n</blockquote>\n</li>\n</ol>',
    'should support indenting w/ 3 spaces'
  )

  assert.equal(
    micromark(
      '    1.  A paragraph\n        with two lines.\n\n            indented code\n\n        > A block quote.'
    ),
    '<pre><code>1.  A paragraph\n    with two lines.\n\n        indented code\n\n    &gt; A block quote.\n</code></pre>',
    'should not support indenting w/ 4 spaces'
  )

  assert.equal(
    micromark(
      '  1.  A paragraph\nwith two lines.\n\n          indented code\n\n      > A block quote.'
    ),
    '<ol>\n<li>\n<p>A paragraph\nwith two lines.</p>\n<pre><code>indented code\n</code></pre>\n<blockquote>\n<p>A block quote.</p>\n</blockquote>\n</li>\n</ol>',
    'should support lazy lines'
  )

  assert.equal(
    micromark('  1.  A paragraph\n    with two lines.'),
    '<ol>\n<li>A paragraph\nwith two lines.</li>\n</ol>',
    'should support partially lazy lines'
  )

  assert.equal(
    micromark('> 1. > Blockquote\ncontinued here.'),
    '<blockquote>\n<ol>\n<li>\n<blockquote>\n<p>Blockquote\ncontinued here.</p>\n</blockquote>\n</li>\n</ol>\n</blockquote>',
    'should support lazy lines combined w/ other containers'
  )

  assert.equal(
    micromark('> 1. > Blockquote\n> continued here.'),
    '<blockquote>\n<ol>\n<li>\n<blockquote>\n<p>Blockquote\ncontinued here.</p>\n</blockquote>\n</li>\n</ol>\n</blockquote>',
    'should support partially continued, partially lazy lines combined w/ other containers'
  )

  assert.equal(
    micromark('- foo\n  - bar\n    - baz\n      - boo'),
    '<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>baz\n<ul>\n<li>boo</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>',
    'should support sublists w/ enough spaces (1)'
  )

  assert.equal(
    micromark('- foo\n - bar\n  - baz\n   - boo'),
    '<ul>\n<li>foo</li>\n<li>bar</li>\n<li>baz</li>\n<li>boo</li>\n</ul>',
    'should not support sublists w/ too few spaces'
  )

  assert.equal(
    micromark('10) foo\n    - bar'),
    '<ol start="10">\n<li>foo\n<ul>\n<li>bar</li>\n</ul>\n</li>\n</ol>',
    'should support sublists w/ enough spaces (2)'
  )

  assert.equal(
    micromark('10) foo\n   - bar'),
    '<ol start="10">\n<li>foo</li>\n</ol>\n<ul>\n<li>bar</li>\n</ul>',
    'should not support sublists w/ too few spaces (2)'
  )

  assert.equal(
    micromark('- - foo'),
    '<ul>\n<li>\n<ul>\n<li>foo</li>\n</ul>\n</li>\n</ul>',
    'should support sublists (1)'
  )

  assert.equal(
    micromark('1. - 2. foo'),
    '<ol>\n<li>\n<ul>\n<li>\n<ol start="2">\n<li>foo</li>\n</ol>\n</li>\n</ul>\n</li>\n</ol>',
    'should support sublists (2)'
  )

  assert.equal(
    micromark('- # Foo\n- Bar\n  ---\n  baz'),
    '<ul>\n<li>\n<h1>Foo</h1>\n</li>\n<li>\n<h2>Bar</h2>\nbaz</li>\n</ul>',
    'should support headings in list items'
  )

  assert.equal(
    micromark('- foo\n- bar\n+ baz'),
    '<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<ul>\n<li>baz</li>\n</ul>',
    'should support a new list by changing the marker (unordered)'
  )

  assert.equal(
    micromark('1. foo\n2. bar\n3) baz'),
    '<ol>\n<li>foo</li>\n<li>bar</li>\n</ol>\n<ol start="3">\n<li>baz</li>\n</ol>',
    'should support a new list by changing the marker (ordered)'
  )

  assert.equal(
    micromark('Foo\n- bar\n- baz'),
    '<p>Foo</p>\n<ul>\n<li>bar</li>\n<li>baz</li>\n</ul>',
    'should support interrupting a paragraph'
  )

  assert.equal(
    micromark('a\n2. b'),
    '<p>a\n2. b</p>',
    'should not support interrupting a paragraph with a non-1 numbered item'
  )

  assert.equal(
    micromark('\n2. a'),
    '<ol start="2">\n<li>a</li>\n</ol>',
    'should “interrupt” a blank line (1)'
  )

  assert.equal(
    micromark('a\n\n2. b'),
    '<p>a</p>\n<ol start="2">\n<li>b</li>\n</ol>',
    'should “interrupt” a blank line (2)'
  )

  assert.equal(
    micromark('a\n1. b'),
    '<p>a</p>\n<ol>\n<li>b</li>\n</ol>',
    'should support interrupting a paragraph with a 1 numbered item'
  )

  assert.equal(
    micromark('- foo\n\n- bar\n\n\n- baz'),
    '<ul>\n<li>\n<p>foo</p>\n</li>\n<li>\n<p>bar</p>\n</li>\n<li>\n<p>baz</p>\n</li>\n</ul>',
    'should support blank lines between items (1)'
  )

  assert.equal(
    micromark('- foo\n  - bar\n    - baz\n\n\n      bim'),
    '<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>\n<p>baz</p>\n<p>bim</p>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>',
    'should support blank lines between items (2)'
  )

  assert.equal(
    micromark('- foo\n- bar\n\n<!-- -->\n\n- baz\n- bim', {
      allowDangerousHtml: true
    }),
    '<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<!-- -->\n<ul>\n<li>baz</li>\n<li>bim</li>\n</ul>',
    'should support HTML comments between lists'
  )

  assert.equal(
    micromark('-   foo\n\n    notcode\n\n-   foo\n\n<!-- -->\n\n    code', {
      allowDangerousHtml: true
    }),
    '<ul>\n<li>\n<p>foo</p>\n<p>notcode</p>\n</li>\n<li>\n<p>foo</p>\n</li>\n</ul>\n<!-- -->\n<pre><code>code\n</code></pre>',
    'should support HTML comments between lists and indented code'
  )

  assert.equal(
    micromark('- a\n - b\n  - c\n   - d\n  - e\n - f\n- g'),
    '<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d</li>\n<li>e</li>\n<li>f</li>\n<li>g</li>\n</ul>',
    'should not support lists in lists w/ too few spaces (1)'
  )

  assert.equal(
    micromark('1. a\n\n  2. b\n\n   3. c'),
    '<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>c</p>\n</li>\n</ol>',
    'should not support lists in lists w/ too few spaces (2)'
  )

  assert.equal(
    micromark('- a\n - b\n  - c\n   - d\n    - e'),
    '<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d\n- e</li>\n</ul>',
    'should not support lists in lists w/ too few spaces (3)'
  )

  assert.equal(
    micromark('1. a\n\n  2. b\n\n    3. c'),
    '<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n</ol>\n<pre><code>3. c\n</code></pre>',
    'should not support lists in lists w/ too few spaces (3)'
  )

  assert.equal(
    micromark('- a\n- b\n\n- c'),
    '<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>c</p>\n</li>\n</ul>',
    'should support loose lists w/ a blank line between (1)'
  )

  assert.equal(
    micromark('* a\n*\n\n* c'),
    '<ul>\n<li>\n<p>a</p>\n</li>\n<li></li>\n<li>\n<p>c</p>\n</li>\n</ul>',
    'should support loose lists w/ a blank line between (2)'
  )

  assert.equal(
    micromark('- a\n- b\n\n  c\n- d'),
    '<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>',
    'should support loose lists w/ a blank line in an item (1)'
  )

  assert.equal(
    micromark('- a\n- b\n\n  [ref]: /url\n- d'),
    '<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>',
    'should support loose lists w/ a blank line in an item (2)'
  )

  assert.equal(
    micromark('- a\n- ```\n  b\n\n\n  ```\n- c'),
    '<ul>\n<li>a</li>\n<li>\n<pre><code>b\n\n\n</code></pre>\n</li>\n<li>c</li>\n</ul>',
    'should support tight lists w/ a blank line in fenced code'
  )

  assert.equal(
    micromark('- a\n  - b\n\n    c\n- d'),
    '<ul>\n<li>a\n<ul>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n</ul>\n</li>\n<li>d</li>\n</ul>',
    'should support tight lists w/ a blank line in a sublist'
  )

  assert.equal(
    micromark('* a\n  > b\n  >\n* c'),
    '<ul>\n<li>a\n<blockquote>\n<p>b</p>\n</blockquote>\n</li>\n<li>c</li>\n</ul>',
    'should support tight lists w/ a blank line in a block quote'
  )

  assert.equal(
    micromark('- a\n  > b\n  ```\n  c\n  ```\n- d'),
    '<ul>\n<li>a\n<blockquote>\n<p>b</p>\n</blockquote>\n<pre><code>c\n</code></pre>\n</li>\n<li>d</li>\n</ul>',
    'should support tight lists w/ flow w/o blank line'
  )

  assert.equal(
    micromark('- a'),
    '<ul>\n<li>a</li>\n</ul>',
    'should support tight lists w/ a single content'
  )

  assert.equal(
    micromark('- a\n  - b'),
    '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ul>',
    'should support tight lists w/ a sublist'
  )

  assert.equal(
    micromark('1. ```\n   foo\n   ```\n\n   bar'),
    '<ol>\n<li>\n<pre><code>foo\n</code></pre>\n<p>bar</p>\n</li>\n</ol>',
    'should support loose lists w/ a blank line in an item'
  )

  assert.equal(
    micromark('* foo\n  * bar\n\n  baz'),
    '<ul>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n<p>baz</p>\n</li>\n</ul>',
    'should support loose lists w/ tight sublists (1)'
  )

  assert.equal(
    micromark('- a\n  - b\n  - c\n\n- d\n  - e\n  - f'),
    '<ul>\n<li>\n<p>a</p>\n<ul>\n<li>b</li>\n<li>c</li>\n</ul>\n</li>\n<li>\n<p>d</p>\n<ul>\n<li>e</li>\n<li>f</li>\n</ul>\n</li>\n</ul>',
    'should support loose lists w/ tight sublists (2)'
  )

  // Extra.
  assert.equal(
    micromark('* a\n*\n\n  \n\t\n* b'),
    '<ul>\n<li>\n<p>a</p>\n</li>\n<li></li>\n<li>\n<p>b</p>\n</li>\n</ul>',
    'should support continued list items after an empty list item w/ many blank lines'
  )

  assert.equal(
    micromark('*\n  ~~~p\n\n  ~~~'),
    '<ul>\n<li>\n<pre><code class="language-p">\n</code></pre>\n</li>\n</ul>',
    'should support blank lines in code after an initial blank line'
  )

  assert.equal(
    micromark(
      '* a tight item that ends with an html element: `x`\n\nParagraph'
    ),
    '<ul>\n<li>a tight item that ends with an html element: <code>x</code></li>\n</ul>\n<p>Paragraph</p>',
    'should ignore line endings after tight items ending in tags'
  )

  assert.equal(
    micromark('*   foo\n\n*\n\n*   bar'),
    '<ul>\n<li>\n<p>foo</p>\n</li>\n<li></li>\n<li>\n<p>bar</p>\n</li>\n</ul>',
    'should support empty items in a spread list'
  )

  assert.equal(
    micromark('- ```\n\n  ```'),
    '<ul>\n<li>\n<pre><code>\n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (0 space)'
  )

  assert.equal(
    micromark('- ```\n \n  ```'),
    '<ul>\n<li>\n<pre><code>\n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (1 space)'
  )

  assert.equal(
    micromark('- ```\n  \n  ```'),
    '<ul>\n<li>\n<pre><code>\n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (2 spaces)'
  )

  assert.equal(
    micromark('- ```\n   \n  ```'),
    '<ul>\n<li>\n<pre><code> \n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (3 spaces)'
  )

  assert.equal(
    micromark('- ```\n    \n  ```'),
    '<ul>\n<li>\n<pre><code>  \n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (4 spaces)'
  )

  assert.equal(
    micromark('- ```\n\t\n  ```'),
    '<ul>\n<li>\n<pre><code>  \n</code></pre>\n</li>\n</ul>',
    'should remove indent of code (fenced) in list (1 tab)'
  )

  assert.equal(
    micromark('- +\n-'),
    '<ul>\n<li>\n<ul>\n<li></li>\n</ul>\n</li>\n<li></li>\n</ul>',
    'should support complex nested and empty lists (1)'
  )

  assert.equal(
    micromark('- 1.\n-'),
    '<ul>\n<li>\n<ol>\n<li></li>\n</ol>\n</li>\n<li></li>\n</ul>',
    'should support complex nested and empty lists (2)'
  )

  assert.equal(
    micromark('* - +\n* -'),
    '<ul>\n<li>\n<ul>\n<li>\n<ul>\n<li></li>\n</ul>\n</li>\n</ul>\n</li>\n<li>\n<ul>\n<li></li>\n</ul>\n</li>\n</ul>',
    'should support complex nested and empty lists (3)'
  )

  assert.equal(
    micromark('* a\n\n<!---->\n\n* b', {allowDangerousHtml: true}),
    '<ul>\n<li>a</li>\n</ul>\n<!---->\n<ul>\n<li>b</li>\n</ul>',
    'should support the common list breaking comment method'
  )

  assert.equal(
    micromark('- one\n\n two', {extensions: [{disable: {null: ['list']}}]}),
    '<p>- one</p>\n<p>two</p>',
    'should support turning off lists'
  )
})
