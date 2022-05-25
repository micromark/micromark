# micromark-util-decode-string

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][bundle-size-badge]][bundle-size]
[![Sponsors][sponsors-badge]][opencollective]
[![Backers][backers-badge]][opencollective]
[![Chat][chat-badge]][chat]

micromark utility to decode markdown strings.

## Contents

*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`decodeString(value)`](#decodestringvalue)
*   [Security](#security)
*   [Contribute](#contribute)
*   [License](#license)

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, 18.0+), install with [npm][]:

```sh
npm install micromark-util-decode-string
```

In Deno with [`esm.sh`][esmsh]:

```js
import {decodeString} from 'https://esm.sh/micromark-util-decode-string@1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {decodeString} from 'https://esm.sh/micromark-util-decode-string@1?bundle'
</script>
```

## Use

```js
import {decodeString} from 'micromark-util-decode-string'

decodeString('a &semi; b') // 'a ; b'
decodeString('a \\; b') // 'a ; b'
decodeString('a ; b') // 'a ; b'
```

## API

This module exports the following identifiers: `decodeString`.
There is no default export.

### `decodeString(value)`

micromark utility to decode markdown strings (which occur in places such as
fenced code info strings, destinations, labels, and titles).
The “string” content type allows character escapes and -references.
This decodes those.

###### Parameters

*   `value` (`string`) — Value to decode.

###### Returns

`string` — Decoded value.

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

[downloads-badge]: https://img.shields.io/npm/dm/micromark-util-normalize-identifier.svg

[downloads]: https://www.npmjs.com/package/micromark-util-normalize-identifier

[bundle-size-badge]: https://img.shields.io/bundlephobia/minzip/micromark-util-normalize-identifier.svg

[bundle-size]: https://bundlephobia.com/result?p=micromark-util-normalize-identifier

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
