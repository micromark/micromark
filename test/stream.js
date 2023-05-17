import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import {promises as fs, createReadStream, createWriteStream} from 'node:fs'
import stream from 'node:stream'
import test from 'node:test'
import concat from 'concat-stream'
import {stream as micromark} from 'micromark/stream.js'
import {slowStream} from './util/slow-stream.js'

test('stream', async function (t) {
  await t.test('should support streaming', function () {
    return new Promise(function (resolve) {
      slowStream(
        '`` some code? No, not code! A link though: <http://example.com>'
      )
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(
              result,
              '<p>`` some code? No, not code! A link though: <a href="http://example.com">http://example.com</a></p>',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support streaming buffers', function () {
    return new Promise(function (resolve) {
      slowStream(Buffer.from('<admin@example.com>'))
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(
              result,
              '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support reference-first definition-later', function () {
    return new Promise(function (resolve) {
      slowStream('[x]\n\n[x]: y')
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(result, '<p><a href="y">x</a></p>\n', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support emphasis and strong', function () {
    return new Promise(function (resolve) {
      slowStream('***x**y**')
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(result, '<p><em><strong>x</strong>y</em>*</p>', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support carriage returns between flow', function () {
    return new Promise(function (resolve) {
      slowStream('***\r\r    fn()\r\r### Heading\r\r')
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(
              result,
              '<hr />\r<pre><code>fn()\r</code></pre>\r<h3>Heading</h3>\r',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test(
    'should support carriage return + line feeds in flow',
    function () {
      return new Promise(function (resolve) {
        slowStream('***\r\n\r\n    fn()\r\n\r\n### Heading\r\n\r\n')
          .pipe(micromark())
          .pipe(
            concat(function (result) {
              assert.equal(
                result,
                '<hr />\r\n<pre><code>fn()\r\n</code></pre>\r\n<h3>Heading</h3>\r\n',
                'pass'
              )

              resolve(undefined)
            })
          )
      })
    }
  )

  await t.test(
    'should integrate w/ `fs.create{Read,Write}Stream`',
    async function () {
      await fs.writeFile('integrate-input', '&because;')

      return new Promise((resolve) => {
        createReadStream('integrate-input')
          .pipe(micromark())
          .pipe(createWriteStream('integrate-output'))
          .on('close', async function () {
            assert.equal(
              String(await fs.readFile('integrate-output')),
              '<p>∵</p>',
              'pass'
            )

            await fs.unlink('integrate-input')
            await fs.unlink('integrate-output')

            resolve(undefined)
          })
      })
    }
  )

  await t.test('should be safe by default', function () {
    return new Promise((resolve) => {
      slowStream('<x>')
        .pipe(micromark())
        .pipe(
          concat(function (result) {
            assert.equal(result, '&lt;x&gt;', 'pass')
            resolve(undefined)
          })
        )
    })
  })

  await t.test('should be unsafe w/ `allowDangerousHtml`', function () {
    slowStream('<x>')
      .pipe(micromark({allowDangerousHtml: true}))
      .pipe(
        concat(function (result) {
          assert.equal(result, '<x>', 'pass')
        })
      )
  })

  await t.test('should stream in non-UTF8', async function () {
    const encoding = 'utf16le'
    const doc = [
      'A bit of arabic: الإعلان العالمي لحقوق الإنسان',
      'Some hebrew: הכרזה לכל באי עולם בדבר זכויות האדם',
      'Mongolian (Halh, Mongolian script): ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂ ᠠᠳᠠᠯᠢᠬᠠᠨ ᠨᠡᠷ',
      'And some happy families: 🎊👩‍👩‍👦‍👦👨‍👨‍👧‍👦🌈'
    ].join('\n')

    await fs.writeFile('non-utf8-input', doc, encoding)

    return new Promise((resolve) => {
      createReadStream('non-utf8-input', {
        encoding,
        highWaterMark: 1
      })
        .pipe(micromark())
        .pipe(createWriteStream('non-utf8-output'))
        .on('close', async function () {
          assert.equal(
            String(await fs.readFile('non-utf8-output')),
            '<p>' + doc + '</p>',
            'pass'
          )

          await fs.unlink('non-utf8-input')
          await fs.unlink('non-utf8-output')

          resolve(undefined)
        })
    })
  })

  await t.test('#end and #write', function () {
    /** @type {ReturnType<micromark>} */
    let s
    /** @type {number} */
    let phase

    assert.equal(micromark().end(), true, 'should return true for `end`')

    assert.throws(
      function () {
        const tr = micromark()
        tr.end()
        tr.end()
      },
      /^Error: Did not expect `write` after `end`$/,
      'should throw on end after end'
    )

    s = micromark()
    s.pipe(
      concat(function (value) {
        assert.equal(String(value), '', 'should end w/o ever receiving data')
      })
    )
    s.end()

    s = micromark()
    s.pipe(
      concat(function (value) {
        assert.equal(String(value), '<p>x</p>', 'should end')
      }),
      {end: true}
    )
    s.end('x')

    s = micromark()
    s.pipe(
      concat(function (value) {
        assert.equal(
          String(value),
          '<p>alpha</p>',
          'should receive final data from `end`'
        )
      })
    )
    s.end('alpha')

    s = micromark()
    s.pipe(
      concat(function (value) {
        assert.equal(String(value), '<p>brC!vo</p>', 'should honour encoding')
      })
    )
    // @ts-expect-error Types for `WritableStream#end` are wrong: buffers are
    // fine.
    s.end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    phase = 0

    s = micromark()
    s.pipe(
      concat(function () {
        assert.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
    )
    s.end('charlie', function () {
      assert.equal(phase, 0, 'should trigger callback before data')
      phase++
    })

    phase = 0

    micromark().end(() => {
      phase++
    })

    assert.equal(
      phase,
      1,
      'should trigger callback when it’s the only argument'
    )
  })

  await t.test('#pipe', function () {
    /** @type {ReturnType<micromark>} */
    let tr

    assert.doesNotThrow(function () {
      // Not writable.
      const tr = micromark()
      // @ts-expect-error Runtime.
      tr.pipe(new stream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    tr = micromark()
    const s = new stream.PassThrough()
    // @ts-expect-error `std{err,out}` can have this field.
    s._isStdio = true // Act as if we’re stdout.

    tr.pipe(s)

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')

    assert.doesNotThrow(function () {
      s.write('delta')
    }, 'should not `end` stdio streams')

    tr = micromark().on('error', function (/** @type {Error} */ error) {
      assert.equal(error.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new stream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = micromark()
    tr.pipe(new stream.PassThrough())

    assert.throws(
      function () {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = micromark()

    tr.pipe(
      concat(function (buf) {
        assert.equal(
          String(buf),
          '<p>alphabravocharlie</p>',
          'should pipe the processed result'
        )
      })
    ).on('error', function () {
      assert.fail('should not trigger `error`')
    })

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })
})
