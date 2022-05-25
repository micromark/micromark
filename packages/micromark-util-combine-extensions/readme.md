# micromark-util-combine-extensions

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][bundle-size-badge]][bundle-size]
[![Sponsors][sponsors-badge]][opencollective]
[![Backers][backers-badge]][opencollective]
[![Chat][chat-badge]][chat]

micromark utility to combine [syntax][] or [html][] extensions.

## Contents

*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`combineExtensions(extensions)`](#combineextensionsextensions)
    *   [`combineHtmlExtensions(htmlExtensions)`](#combinehtmlextensionshtmlextensions)
*   [Security](#security)
*   [Contribute](#contribute)
*   [License](#license)

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, 18.0+), install with [npm][]:

```sh
npm install micromark-util-combine-extensions
```

In Deno with [`esm.sh`][esmsh]:

```js
import {combineExtensions} from 'https://esm.sh/micromark-util-combine-extensions@1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {combineExtensions} from 'https://esm.sh/micromark-util-combine-extensions@1?bundle'
</script>
```

## Use

```js
import {gfmAutolinkLiteral} from 'micromark-extension-gfm-autolink-literal'
import {gfmStrikethrough} from 'micromark-extension-gfm-strikethrough'
import {gfmTable} from 'micromark-extension-gfm-table'
import {gfmTaskListItem} from 'micromark-extension-gfm-task-list-item'
import {combineExtensions} from 'micromark-util-combine-extensions'

const gfm = combineExtensions([gfmAutolinkLiteral, gfmStrikethrough(), gfmTable, gfmTaskListItem])
```

## API

This module exports the following identifiers: `combineExtensions`,
`combineHtmlExtensions`.
There is no default export.

### `combineExtensions(extensions)`

Combine several syntax extensions into one.

###### Parameters

*   `extensions` (`Array<Extension>`) — List of syntax extensions

###### Returns

A single combined extension (`Extension`).

### `combineHtmlExtensions(htmlExtensions)`

Combine several html extensions into one.

###### Parameters

*   `htmlExtensions` (`Array<HtmlExtension>`) — List of html extensions

###### Returns

A single combined html extension (`HtmlExtension`).

## Security

See [`security.md`][securitymd] in [`micromark/.github`][health] for how to
submit a security report.

## Contribute

See [`contributing.md`][contributing] in [`micromark/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/micromark/micromark/workflows/main/badge.svg

[build]: https://github.com/micromark/micromark/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/micromark/micromark.svg

[coverage]: https://codecov.io/github/micromark/micromark

[downloads-badge]: https://img.shields.io/npm/dm/micromark-util-combine-extensions.svg

[downloads]: https://www.npmjs.com/package/micromark-util-combine-extensions

[bundle-size-badge]: https://img.shields.io/bundlephobia/minzip/micromark-util-combine-extensions.svg

[bundle-size]: https://bundlephobia.com/result?p=micromark-util-combine-extensions

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[opencollective]: https://opencollective.com/unified

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/micromark/micromark/discussions

[license]: https://github.com/micromark/micromark/blob/main/license

[author]: https://wooorm.com

[health]: https://github.com/micromark/.github

[securitymd]: https://github.com/micromark/.github/blob/HEAD/security.md

[contributing]: https://github.com/micromark/.github/blob/HEAD/contributing.md

[support]: https://github.com/micromark/.github/blob/HEAD/support.md

[coc]: https://github.com/micromark/.github/blob/HEAD/code-of-conduct.md

[syntax]: https://github.com/micromark/micromark#syntaxextension

[html]: https://github.com/micromark/micromark#htmlextension
