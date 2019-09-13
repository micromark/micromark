<!--lint disable no-html-->

<h1 align="center">
  <img src="https://raw.githubusercontent.com/micromark/micromark/9c34547/logo.svg?sanitize=true" alt="micromark" width="400" />
</h1>

<p align="center">
  <a href="https://opencollective.com/unified"><img src="https://opencollective.com/unified/sponsors/badge.svg" alt="Sponsors"></a>
  <a href="https://opencollective.com/unified"><img src="https://opencollective.com/unified/backers/badge.svg" alt="Backers"></a>
  <a href="https://spectrum.chat/unified/micromark"><img src="https://img.shields.io/badge/chat-spectrum-7b16ff.svg" alt="Chat"></a>
</p>

<p align="center">
  <b>New, tiny, and fast Markdown parser <br> part of the unified collective</b>
</p>

## Sponsors

<table>
  <tr valign="top">
    <td width="20%" align="center">
      <a href="https://zeit.co"><img src="https://avatars1.githubusercontent.com/u/14985020?s=400&v=4"></a>
      <br><br>🥇
      <a href="https://zeit.co">ZEIT</a>
    </td>
    <td width="20%" align="center">
      <a href="https://www.gatsbyjs.org"><img src="https://avatars1.githubusercontent.com/u/12551863?s=400&v=4"></a>
      <br><br>🥇
      <a href="https://www.gatsbyjs.org">Gatsby</a>
    </td>
    <td width="20%" align="center">
      <a href="https://www.netlify.com"><img src="https://avatars1.githubusercontent.com/u/7892489?s=400&v=4"></a>
      <br><br>🥇
      <a href="https://www.netlify.com">Netlify</a>
    </td>
    <td width="20%" align="center">
      <a href="https://www.holloway.com"><img src="https://avatars1.githubusercontent.com/u/35904294?s=400&v=4"></a>
      <br><br>
      <a href="https://www.holloway.com">Holloway</a>
    </td>
    <td width="20%" align="center">
      <br><br><br><br>
      <a href="https://opencollective.com/unified"><strong>You?</strong>
    </td>
  </tr>
</table>

## What’s micromark

Something like [remark][] (Markdown processor powered by plugins based on
[unified][]), but on a lower level: a [lexer][] (in nerdy terms 🤓).
Syntax trees have many good things, but they do come with the downside of
having a big memory footprint and sometimes being more than what you need.

**We’re launching micromark as just an idea.
The first line of code still needs to be written.
But we imagine it to be**:

*   **small** in file size, max 10 kB minzipped, and tiny in memory use
*   **fast** in speed, compared to existing parsers on real world documents
*   **safe** to use, it should safely work on untrusted content by default
*   **compliant** to CommonMark but **extensible** for GFM (GitHub Flavored
    Markdown), MDX, etc.
*   **complete**, in that it should give access to all info in the source
    document

*But it’s not:*

*   something that creates HTML and the like: other projects use micromark for
    that
*   something that creates a syntax tree: remark will use it to do just that

## How it’ll be used

**micromark is part of the [unified][] collective**.
But it will likely not be something you’d directly interact with, unless
you’re interested in working on parsers,.
It will make high-level tooling better.

Evolving unified shouldn’t just be about new high-level features but also about
rethinking core mechanisms.
**That’s where micromark comes in, so unified can build the most friendly,
secure, fast, and extensive bridges between content formats.**

## Contribute

See [`contributing.md`][contributing] in [`micromark/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[remark]: https://github.com/remarkjs/remark

[unified]: https://github.com/unifiedjs/unified

[lexer]: https://en.wikipedia.org/wiki/Lexical_analysis

[health]: https://github.com/micromark/.github

[contributing]: https://github.com/micromark/.github/blob/master/contributing.md

[support]: https://github.com/micromark/.github/blob/master/support.md

[coc]: https://github.com/micromark/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com
