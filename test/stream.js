import assert from 'node:assert/strict'
import {createReadStream, createWriteStream, promises as fs} from 'node:fs'
import {PassThrough, Readable} from 'node:stream'
import test from 'node:test'
import concatStream from 'concat-stream'
import {stream} from 'micromark/stream'
import {slowStream} from './util/slow-stream.js'

test('stream', async function (t) {
  await t.test('should support streaming', function () {
    return new Promise(function (resolve) {
      slowStream(
        '`` some code? No, not code! A link though: <http://example.com>'
      )
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
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

  await t.test('should support streaming typed arrays', function () {
    return new Promise(function (resolve) {
      slowStream(new TextEncoder().encode('<admin@example.com>'))
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
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
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '<p><a href="y">x</a></p>\n', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support emphasis and strong', function () {
    return new Promise(function (resolve) {
      slowStream('***x**y**')
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '<p><em><strong>x</strong>y</em>*</p>', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support carriage returns between flow', function () {
    return new Promise(function (resolve) {
      slowStream('***\r\r    fn()\r\r### Heading\r\r')
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
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
          .pipe(stream())
          .pipe(
            concatStream(function (result) {
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

      return new Promise(function (resolve) {
        createReadStream('integrate-input')
          .pipe(stream())
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
    return new Promise(function (resolve) {
      slowStream('<x>')
        .pipe(stream())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '&lt;x&gt;', 'pass')
            resolve(undefined)
          })
        )
    })
  })

  await t.test('should be unsafe w/ `allowDangerousHtml`', function () {
    slowStream('<x>')
      .pipe(stream({allowDangerousHtml: true}))
      .pipe(
        concatStream(function (result) {
          assert.equal(result, '<x>', 'pass')
        })
      )
  })

  await t.test('should stream in non-UTF8', async function () {
    const encoding = 'utf16le'
    const document = [
      'A bit of arabic: الإعلان العالمي لحقوق الإنسان',
      'Some hebrew: הכרזה לכל באי עולם בדבר זכויות האדם',
      'Mongolian (Halh, Mongolian script): ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂ ᠠᠳᠠᠯᠢᠬᠠᠨ ᠨᠡᠷ',
      'And some happy families: 🎊👩‍👩‍👦‍👦👨‍👨‍👧‍👦🌈'
    ].join('\n')

    await fs.writeFile('non-utf8-input', document, encoding)

    return new Promise(function (resolve) {
      createReadStream('non-utf8-input', {encoding, highWaterMark: 1})
        .pipe(stream())
        .pipe(createWriteStream('non-utf8-output'))
        .on('close', async function () {
          assert.equal(
            String(await fs.readFile('non-utf8-output')),
            '<p>' + document + '</p>',
            'pass'
          )

          await fs.unlink('non-utf8-input')
          await fs.unlink('non-utf8-output')

          resolve(undefined)
        })
    })
  })

  await t.test('#end', async function (t) {
    await t.test('should return true for `end`', function () {
      assert.equal(stream().end(), true)
    })

    await t.test('should throw on end after end', function () {
      assert.throws(function () {
        const tr = stream()
        tr.end()
        tr.end()
      }, /^Error: Did not expect `write` after `end`$/)
    })

    await t.test('should end w/o ever receiving data', async function () {
      await new Promise(function (resolve) {
        const s = stream()
        s.pipe(
          concatStream(function (value) {
            assert.equal(String(value), '')
            resolve(undefined)
          })
        )
        s.end()
      })
    })

    await t.test('should end', async function () {
      await new Promise(function (resolve) {
        const s = stream()
        s.pipe(
          concatStream(function (value) {
            assert.equal(String(value), '<p>x</p>')
            resolve(undefined)
          }),
          {end: true}
        )
        s.end('x')
      })
    })

    await t.test('should receive final data from `end`', async function () {
      await new Promise(function (resolve) {
        const s = stream()
        s.pipe(
          concatStream(function (value) {
            assert.equal(String(value), '<p>alpha</p>')
            resolve(undefined)
          })
        )
        s.end('alpha')
      })
    })

    await t.test('should honour encoding', async function () {
      await new Promise(function (resolve) {
        const s = stream()
        s.pipe(
          concatStream(function (value) {
            assert.equal(String(value), '<p>abc</p>')
            resolve(undefined)
          })
        )

        // @ts-expect-error: typed arrays + buffer encoding is fine.
        s.end(
          new Uint8Array([0xfe, 0xff, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63]),
          'utf-16be'
        )
      })
    })

    await t.test(
      'should trigger callback and data in the correct order',
      async function () {
        await new Promise(function (resolve) {
          let phase = 0
          const s = stream()
          s.pipe(
            concatStream(function () {
              assert.equal(phase, 1)
              phase++
              resolve(undefined)
            })
          )
          s.end('charlie', function () {
            assert.equal(phase, 0)
            phase++
          })
        })
      }
    )

    await t.test(
      'should trigger callback when it’s the only argument',
      async function () {
        await new Promise(function (resolve) {
          let phase = 0

          stream().end(function () {
            phase++
          })

          assert.equal(phase, 1)
          resolve(undefined)
        })
      }
    )
  })

  await t.test('#pipe', async function (t) {
    await t.test(
      'should not throw when piping to a non-writable stream',
      async function () {
        assert.doesNotThrow(function () {
          // Not writable.
          const tr = stream()
          // @ts-expect-error Runtime.
          tr.pipe(new Readable())
          tr.end('foo')
        })
      }
    )

    await t.test('should not `end` stdio streams', async function () {
      let called = false
      const tr = stream()
      const s = new PassThrough()
      // @ts-expect-error `std{err,out}` can have this field.
      s._isStdio = true // Act as if we’re stdout.

      tr.pipe(s)
      tr.write('alpha')

      tr.write('bravo', function () {
        called = true
      })

      assert(called)

      tr.end('charlie')

      assert.doesNotThrow(function () {
        s.write('delta')
      })
    })

    await t.test('should pass errors', async function () {
      let called = false

      const tr = stream().on('error', function (/** @type {Error} */ error) {
        assert.equal(error.message, 'Whoops!')
        called = true
      })

      tr.pipe(new PassThrough())
      tr.emit('error', new Error('Whoops!'))
      assert(called)
    })

    await t.test(
      'should throw if errors are not listened to',
      async function () {
        const tr = stream()
        tr.pipe(new PassThrough())

        assert.throws(function () {
          tr.emit('error', new Error('Whoops!'))
        }, /Whoops!/)
      }
    )

    await t.test('should pipe the processed result', async function () {
      await new Promise(function (resolve) {
        const tr = stream()

        tr.pipe(
          concatStream(function (buf) {
            assert.equal(String(buf), '<p>alphabravocharlie</p>')
          })
        )
          .on('error', function () {
            assert.fail('should not trigger `error`')
          })
          .on('finish', function () {
            resolve(undefined)
          })

        tr.write('alpha')
        tr.write('bravo')
        tr.end('charlie')
      })
    })
  })
})
