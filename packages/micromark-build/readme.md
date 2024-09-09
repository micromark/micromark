# micromark-build

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Sponsors][sponsors-badge]][opencollective]
[![Backers][backers-badge]][opencollective]
[![Chat][chat-badge]][chat]

Tiny tool to help us maintain [micromark][] and the micromark extensions.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [CLI](#cli)
* [Types](#types)
* [Compatibility](#compatibility)
* [Security](#security)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package is a small CLI to build micromark development source code (for
this monorepo but also for extensions and integrations) into production code.

If you are making a micromark extension or are otherwise integrating with
its code, you *should* use this.

State machines are hard: assertions, debugging messages, and readable names
are great to develop with, but slow or big in production, this solves that.

## When should I use this?

This package is useful when you are making your own micromark extensions.

## Install

In Node.js (version 16+), install with [npm][]:

```sh
npm install micromark-build --save-dev
```

## Use

Say we have this folder (called `my-micromark-extension`):

```txt
dev/lib/core.js
dev/lib/util.js
dev/index.js
```

And we add `micromark-build` in a `build` script in `package.json`:

```js
"scripts": {
  "build": "micromark-build"
},
```

Now, running that with `npm run build`, we’d get:

```diff
 dev/lib/core.js
 dev/lib/util.js
 dev/index.js
+lib/core.js
+lib/util.js
+index.js
```

To expose the production code by default, and the `dev/` files on a condition,
use an export map in `package.json`:

```json
"exports": {
  "development": "./dev/index.js",
  "default": "./index.js"
},
```

Users can then use `node --conditions development` to use the dev files.

## CLI

There is no interface and there are no options.
See Use above: run it and get files out.

The following Babel plugins are used:

* [`babel-plugin-unassert`](https://github.com/unassert-js/babel-plugin-unassert)
  — Remove [`assert`](https://nodejs.org/api/assert.html),
  [`power-assert`](https://github.com/power-assert-js/power-assert),
  [`uvu/assert`](https://github.com/lukeed/uvu), and
  [`devlop`](https://github.com/wooorm/devlop) calls
* [`babel-plugin-undebug`](https://github.com/wooorm/babel-plugin-undebug)
  — Remove [`debug`](https://github.com/visionmedia/debug) calls
* [`babel-plugin-inline-constants`](https://github.com/wooorm/babel-plugin-inline-constants)
  — Inline the values from
  [`micromark-util-symbol`](https://github.com/micromark/micromark/tree/main/packages/micromark-util-symbol)

You should use `devlop`, `debug`, and `micromark-util-symbol` to develop
micromark extensions!

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `micromark-build@2`,
compatible with Node.js 16.

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

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[opencollective]: https://opencollective.com/unified

[npm]: https://docs.npmjs.com/cli/install

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/micromark/micromark/discussions

[license]: https://github.com/micromark/micromark/blob/main/license

[author]: https://wooorm.com

[health]: https://github.com/micromark/.github

[securitymd]: https://github.com/micromark/.github/blob/main/security.md

[contributing]: https://github.com/micromark/.github/blob/main/contributing.md

[support]: https://github.com/micromark/.github/blob/main/support.md

[coc]: https://github.com/micromark/.github/blob/main/code-of-conduct.md

[typescript]: https://www.typescriptlang.org

[micromark]: https://github.com/micromark/micromark
