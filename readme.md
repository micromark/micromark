<h1 align="center">
  <img src="https://raw.githubusercontent.com/micromark/micromark/9c34547/logo.svg?sanitize=true" alt="micromark" width="400" />
</h1>

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][opencollective]
[![Backers][backers-badge]][opencollective]
[![Chat][chat-badge]][chat]

smol markdown parser that’s different (open beta)

## Intro

micromark is a long awaited markdown parser.
It uses a [state machine][cmsm] to parse the entirety of markdown into tokens.
It’s the smallest [CommonMark][] compliant markdown parser in JavaScript.
It’ll replace the internals of [`remark-parse`][remark-parse], the most
[popular][] markdown parser.
Its interface is optimized to compile to HTML, but its parts can be used
to generate syntax trees or compile to other output formats too.
It’s in open beta: up next are extensions (GFM, MDX), integration in remark,
performance, CSTs, and docs.

*   for updates, see [Twitter][]
*   for more about us, see [`unifiedjs.com`][site]
*   for questions, see [Discussions][chat]
*   to help, see [contribute][] or [sponsor][] below

## Contents

*   [Checklist](#checklist)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`micromark(doc[, encoding][, options])`](#micromarkdoc-encoding-options)
    *   [`createSteam(options?)`](#createsteamoptions)
*   [List of extensions](#list-of-extensions)
*   [Version](#version)
*   [Security](#security)
*   [Contribute](#contribute)
*   [Sponsor](#sponsor)
*   [License](#license)

## Checklist

*   [x] CommonMark compliant
*   [x] Smallest CM parser that exists (and there’s some more to shave off!)
*   [x] Safe by default
*   [x] Streaming interface
*   [x] 1500+ tests and 100% coverage
*   [x] Abstract syntax tree ([`mdast-util-from-markdown`][from-markdown],
    [`mdast-util-to-markdown`][to-markdown])
*   [ ] [Extensions][]: GFM, directives, MDX
*   [ ] Integrate into remark
*   [ ] Complementary docs on state machine ([CMSM][]) for parsers in other
    languages
*   [ ] Performance
*   [ ] Concrete syntax tree

## Install

[npm][]:

```sh
npm install micromark
```

## Use

```js
var micromark = require('micromark')

console.log(micromark('## Hello, *world*!'))
```

Yields:

```html
<h2>Hello, <em>world</em>!</h2>
```

Or:

```js
var fs = require('fs')
var micromark = require('micromark/stream')

fs.createReadStream('example.md').pipe(micromark()).pipe(process.stdout)
```

Or use [**remark**][remark], which will soon include micromark, has ASTs, and is
stable.

## API

Note that there are more APIs than listed here currently.
Those are considered to be in progress.

### `micromark(doc[, encoding][, options])`

Compile markdown to HTML.

##### Parameters

###### `doc`

Markdown to parse (`string` or `Buffer`)

###### `encoding`

[Character encoding][encoding] to understand `doc` as when it’s a
[`Buffer`][buffer] (`string`, default: `'utf8'`).

###### `options.defaultLineEnding`

Value to use for line endings not in `doc` (`string`, default: first line
ending or `'\n'`).

Generally, micromark copies line endings (`'\r'`, `'\n'`, `'\r\n'`) in the
markdown document over to the compiled HTML.
In some cases, such as `> a`, CommonMark requires that extra line endings are
added: `<blockquote>\n<p>a</p>\n</blockquote>`.

###### `options.allowDangerousHtml`

Whether to allow embedded HTML (`boolean`, default: `false`).

###### `options.allowDangerousProtocol`

Whether to allow potentially dangerous protocols in links and images (`boolean`,
default: `false`).
URLs relative to the current protocol are always allowed (such as, `image.jpg`).
For links, the allowed protocols are `http`, `https`, `irc`, `ircs`, `mailto`,
and `xmpp`.
For images, the allowed protocols are `http` and `https`.

###### `options.extensions`

Array of syntax extensions (`Array.<SyntaxExtension>`, default: `[]`).

###### `options.htmlExtensions`

Array of HTML extensions (`Array.<HtmlExtension>`, default: `[]`).

##### Returns

`string` — Compiled HTML.

### `createSteam(options?)`

Streaming version of micromark.
Compiles markdown to HTML.
`options` are the same as the buffering API above.
Available at `require('micromark/stream')`.

## List of extensions

*   [`micromark/micromark-extension-frontmatter`](https://github.com/micromark/micromark-extension-frontmatter)
    — support frontmatter (YAML, TOML, etc)
*   [`micromark/micromark-extension-gfm-autolink-literal`](https://github.com/micromark/micromark-extension-gfm-autolink-literal)
    — support GFM autolink literals
*   [`micromark/micromark-extension-gfm-strikethrough`](https://github.com/micromark/micromark-extension-gfm-strikethrough)
    — support GFM strikethrough
*   [`micromark/micromark-extension-gfm-tagfilter`](https://github.com/micromark/micromark-extension-gfm-tagfilter)
    — support GFM tagfilter

## Version

The open beta of micromark starts at version `2.0.0` (there was a different
package published on npm as `micromark` before).
micromark will adhere to semver at `3.0.0`.
Use tilde ranges for now: `"micromark": "~2.0.0"`.

## Security

It’s safe to compile markdown to HTML if it does not include embedded HTML nor
uses dangerous protocols in links (such as `javascript:` or `data:`).
micromark is safe by default if embedded HTML or dangerous protocols are used
too, as it encodes or drops them.
Turning on the `allowDangerousHtml` or `allowDangerousProtocol` options for
user-provided markdown opens you up to [cross-site scripting (XSS)][xss]
attacks.

For more information on markdown sanitation, see
[`improper-markup-sanitization.md`][improper] by [**@chalker**][chalker].

See [`security.md`][security] in [`micromark/.github`][health] for how to submit
a security report.

## Contribute

See [`contributing.md`][contributing] in [`micromark/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## Sponsor

Support this effort and give back by sponsoring on [OpenCollective][]!

<table>
<tr valign="middle">
<td width="100%" align="center" colspan="10">
  <br>
  <a href="https://www.salesforce.com">Salesforce</a> 🏅<br><br>
  <a href="https://www.salesforce.com"><img src="https://images.opencollective.com/salesforce/ca8f997/logo/512.png" width="256"></a>
</td>
</tr>
<tr valign="middle">
<td width="20%" align="center" colspan="2">
  <a href="https://www.gatsbyjs.org">Gatsby</a> 🥇<br><br>
  <a href="https://www.gatsbyjs.org"><img src="https://avatars1.githubusercontent.com/u/12551863?s=256&v=4" width="128"></a>
</td>
<td width="20%" align="center" colspan="2">
  <a href="https://vercel.com">Vercel</a> 🥇<br><br>
  <a href="https://vercel.com"><img src="https://avatars1.githubusercontent.com/u/14985020?s=256&v=4" width="128"></a>
</td>
<td width="20%" align="center" colspan="2">
  <a href="https://www.netlify.com">Netlify</a><br><br>
  <!--OC has a sharper image-->
  <a href="https://www.netlify.com"><img src="https://images.opencollective.com/netlify/4087de2/logo/256.png" width="128"></a>
</td>
<td width="10%" align="center">
  <a href="https://www.holloway.com">Holloway</a><br><br>
  <a href="https://www.holloway.com"><img src="https://avatars1.githubusercontent.com/u/35904294?s=128&v=4" width="64"></a>
</td>
<td width="10%" align="center">
  <a href="https://themeisle.com">ThemeIsle</a><br><br>
  <a href="https://themeisle.com"><img src="https://avatars1.githubusercontent.com/u/58979018?s=128&v=4" width="64"></a>
</td>
<td width="10%" align="center">
  <a href="https://boostio.co">BoostIO</a><br><br>
  <a href="https://boostio.co"><img src="https://avatars1.githubusercontent.com/u/13612118?s=128&v=4" width="64"></a>
</td>
<td width="10%" align="center">
  <a href="https://expo.io">Expo</a><br><br>
  <a href="https://expo.io"><img src="https://avatars1.githubusercontent.com/u/12504344?s=128&v=4" width="64"></a>
</td>
</tr>
<tr valign="middle">
<td width="100%" align="center" colspan="10">
  <br>
  <a href="https://opencollective.com/unified"><strong>You?</strong></a>
  <br><br>
</td>
</tr>
</table>

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/micromark/micromark.svg

[build]: https://travis-ci.org/micromark/micromark

[coverage-badge]: https://img.shields.io/codecov/c/github/micromark/micromark.svg

[coverage]: https://codecov.io/github/micromark/micromark

[downloads-badge]: https://img.shields.io/npm/dm/micromark.svg

[downloads]: https://www.npmjs.com/package/micromark

[size-badge]: https://img.shields.io/bundlephobia/minzip/micromark.svg

[size]: https://bundlephobia.com/result?p=micromark

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[opencollective]: https://opencollective.com/unified

[npm]: https://docs.npmjs.com/cli/install

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/micromark/micromark/discussions

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/micromark/.github

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[security]: https://github.com/micromark/.github/blob/HEAD/security.md

[contributing]: https://github.com/micromark/.github/blob/HEAD/contributing.md

[support]: https://github.com/micromark/.github/blob/HEAD/support.md

[coc]: https://github.com/micromark/.github/blob/HEAD/code-of-conduct.md

[twitter]: https://twitter.com/unifiedjs

[remark]: https://github.com/remarkjs/remark

[site]: https://unifiedjs.com

[contribute]: #contribute

[sponsor]: #sponsor

[encoding]: https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings

[buffer]: https://nodejs.org/api/buffer.html

[commonmark]: https://commonmark.org/

[popular]: https://www.npmtrends.com/remark-parse-vs-marked-vs-markdown-it

[remark-parse]: https://unifiedjs.com/explore/package/remark-parse/

[improper]: https://github.com/ChALkeR/notes/blob/master/Improper-markup-sanitization.md

[chalker]: https://github.com/ChALkeR

[cmsm]: https://github.com/micromark/common-markup-state-machine

[from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[extensions]: #list-of-extensions
