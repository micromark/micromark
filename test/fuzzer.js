const micromark = require('../index')
const frontmatter = require('micromark-extension-frontmatter')
const gfmSyntax = require('micromark-extension-gfm')
const gfmHtml = require('micromark-extension-gfm/html')

function fuzz(buf) {
  try {
    // commonmark buffer without html
    micromark(buf)

    // commonmark with different encodings, without html
    micromark(buf, 'base64')
    micromark(buf, 'ascii')

    // // commonmark buffer with html
    micromark(buf, 'utf-8', {
      allowDangerousHtml: true,
      allowDangerousProtocol: true
    })

    micromark(buf, 'utf-8', {
      extensions: [frontmatter()]
    })

    micromark(buf, 'utf-8', {
      extensions: [frontmatter()],
      allowDangerousHtml: true,
      allowDangerousProtocol: true
    })

    // gfm buffer without html
    micromark(buf, 'utf-8', {
      extensions: [gfmSyntax()],
      htmlExtensions: [gfmHtml]
    })

    // gfm buffer with html
    micromark(buf, 'utf-8', {
      allowDangerousHtml: true,
      allowDangerousProtocol: true,
      extensions: [gfmSyntax()],
      htmlExtensions: [gfmHtml]
    })
  } catch (e) {
    if (e.message.indexOf('Maximum call stack size exceeded') !== -1) {
      return
    }
    throw e
  }
}

module.exports = {
  fuzz
}
