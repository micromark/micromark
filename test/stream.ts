'use strict'

import fs from 'fs'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'stream'.
import stream from 'stream'
import test from 'tape'
import concat from 'concat-stream'
import m from '../stream'

// @ts-expect-error ts-migrate(2339) FIXME: Property 'PassThrough' does not exist on type '(op... Remove this comment to see the full error message
var PassThrough = stream.PassThrough

test('stream', function (t: any) {
  t.test('should support streaming', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream(
      '`` some code? No, not code! A link though: <http://example.com>'
    )
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(
        result,
        '<p>`` some code? No, not code! A link though: <a href="http://example.com">http://example.com</a></p>',
        'pass'
      )
    }
  })

  t.test('should support streaming buffers', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream(Buffer.from('<admin@example.com>'))
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(
        result,
        '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
        'pass'
      )
    }
  })

  t.test('should support reference-first definition-later', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('[x]\n\n[x]: y').pipe(m()).pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(result, '<p><a href="y">x</a></p>\n', 'pass')
    }
  })

  t.test('should support emphasis and strong', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('***x**y**').pipe(m()).pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(result, '<p><em><strong>x</strong>y</em>*</p>', 'pass')
    }
  })

  t.test('should support carriage returns between flow', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('***\r\r    fn()\r\r### Heading\r\r')
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(
        result,
        '<hr />\r<pre><code>fn()\r</code></pre>\r<h3>Heading</h3>\r',
        'pass'
      )
    }
  })

  t.test('should support carriage return + line feeds in flow', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('***\r\n\r\n    fn()\r\n\r\n### Heading\r\n\r\n')
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(
        result,
        '<hr />\r\n<pre><code>fn()\r\n</code></pre>\r\n<h3>Heading</h3>\r\n',
        'pass'
      )
    }
  })

  t.test('should integrate w/ `fs.create{Read,Write}Stream`', function (t: any) {
    t.plan(1)

    fs.writeFileSync('integrate-input', '&because;')

    fs.createReadStream('integrate-input')
      .pipe(m())
      .pipe(fs.createWriteStream('integrate-output'))
      .on('close', onend)

    function onend() {
      t.equal(String(fs.readFileSync('integrate-output')), '<p>∵</p>', 'pass')

      fs.unlinkSync('integrate-input')
      fs.unlinkSync('integrate-output')
    }
  })

  t.test('should be safe by default', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('<x>').pipe(m()).pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(result, '&lt;x&gt;', 'pass')
    }
  })

  t.test('should be unsafe w/ `allowDangerousHtml`', function (t: any) {
    t.plan(1)

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    slowStream('<x>')
      .pipe(m({allowDangerousHtml: true}))
      .pipe(concat(onconcat))

    function onconcat(result: any) {
      t.equal(result, '<x>', 'pass')
    }
  })

  t.test('should stream in non-UTF8', function (t: any) {
    var encoding = 'utf16le'
    var doc = [
      'A bit of arabic: الإعلان العالمي لحقوق الإنسان',
      'Some hebrew: הכרזה לכל באי עולם בדבר זכויות האדם',
      'Mongolian (Halh, Mongolian script): ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂ ᠠᠳᠠᠯᠢᠬᠠᠨ ᠨᠡᠷ',
      'And some happy families: 🎊👩‍👩‍👦‍👦👨‍👨‍👧‍👦🌈'
    ].join('\n')

    t.plan(1)

    fs.writeFileSync('non-utf8-input', doc, encoding)

    fs.createReadStream('non-utf8-input', {
      encoding: encoding,
      highWaterMark: 1
    })
      .pipe(m())
      .pipe(fs.createWriteStream('non-utf8-output'))
      .on('close', onend)

    function onend() {
      t.equal(
        String(fs.readFileSync('non-utf8-output')),
        '<p>' + doc + '</p>',
        'pass'
      )

      fs.unlinkSync('non-utf8-input')
      fs.unlinkSync('non-utf8-output')
    }
  })

  t.test('#end and #write', function (t: any) {
    var s
    var phase: any

    t.plan(8)

    t.equal(m().end(), true, 'should return true for `end`')

    t.throws(
      function () {
        var tr = m()
        tr.end()
        tr.end()
      },
      /^Error: Did not expect `write` after `end`$/,
      'should throw on end after end'
    )

    s = m()
    s.pipe(
      concat(function (value: any) {
        t.equal(String(value), '', 'should end w/o ever receiving data')
      })
    )
    s.end()

    s = m()
    s.pipe(
      concat(function (value: any) {
        t.equal(String(value), '<p>x</p>', 'should end')
      }),
      {end: true}
    )
    s.end('x')

    s = m()
    s.pipe(
      concat(function (value: any) {
        t.equal(
          String(value),
          '<p>alpha</p>',
          'should receive final data from `end`'
        )
      })
    )
    s.end('alpha')

    s = m()
    s.pipe(
      concat(function (value: any) {
        t.equal(String(value), '<p>brC!vo</p>', 'should honour encoding')
      })
    )
    s.end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    phase = 0

    s = m()
    s.pipe(
      concat(function () {
        t.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
    )
    s.end('charlie', function () {
      t.equal(phase, 0, 'should trigger callback before data')
      phase++
    })
  })

  t.test('#pipe', function (st: any) {
    var tr: any
    var s: any

    st.plan(5)

    st.doesNotThrow(function () {
      // Not writable.
      var tr = m()
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'Readable' does not exist on type '(optio... Remove this comment to see the full error message
      tr.pipe(new stream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    tr = m()
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'PassThrough' does not exist on type '(op... Remove this comment to see the full error message
    s = new stream.PassThrough()
    s._isStdio = true // Act as if we’re stdout.

    tr.pipe(s)

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')

    st.doesNotThrow(function () {
      s.write('delta')
    }, 'should not `end` stdio streams')

    tr = m().on('error', function (err: any) {
      st.equal(err.message, 'Whoops!', 'should pass errors')
    })

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'PassThrough' does not exist on type '(op... Remove this comment to see the full error message
    tr.pipe(new stream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = m()
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'PassThrough' does not exist on type '(op... Remove this comment to see the full error message
    tr.pipe(new stream.PassThrough())

    st.throws(
      function () {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = m()

    tr.pipe(
      concat(function (buf: any) {
        st.equal(
          String(buf),
          '<p>alphabravocharlie</p>',
          'should pipe the processed result'
        )
      })
    ).on('error', function () {
      st.fail('should not trigger `error`')
    })

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })

  t.end()
})

function slowStream(value: any, encoding: any) {
  var stream = new PassThrough()
  var index = 0

  tick()

  return stream

  function send() {
    if (index === value.length) {
      stream.end()
    } else {
      stream.write(value.slice(index, ++index), encoding)
      tick()
    }
  }

  function tick() {
    setTimeout(send, 4)
  }
}
