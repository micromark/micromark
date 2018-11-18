<!--lint disable no-html-->

<h1 align="center">
  <img src="https://raw.githubusercontent.com/micromark/micromark/9c34547/logo.svg?sanitize=true" alt="micromark" width="400" />
</h1>

<p align="center">
  <b>a new, tiny, and fast, markdown parser <br> written in TypeScript under the unified umbrella</br></b>
</p>

## Sponsors

<!--lint ignore no-html maximum-line-length-->

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
      <a href="https://www.gatsbyjs.org">Gatsby</a></td>
    <td width="20%" align="center">
      <a href="https://compositor.io"><img src="https://avatars1.githubusercontent.com/u/19245838?s=400&v=4"></a>
      <br><br>🥉
      <a href="https://compositor.io">Compositor</a>
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

Something like [remark][] (markdown processor powered by plugins based on
[unified][]), but on a lower level: a [lexer][] (in nerdy terms 🤓).
Syntax trees have many good things, but they do come with the downside of
having a big memory footprint and sometimes being more than what you need.

**We’re launching micromark as just an idea.
The first line of code still needs to be written.
But we imagine it to be**:

*   **small** in file size, max 10 kB minzipped, and tiny in memory use
*   **fast** in speed, compared to existing parsers on real world documents
*   **safe** to use, it should safely work on untrusted content by default
*   **compliant** to CommonMark but **extendible** for GFM (GitHub Flavored
    Markdown), MDX, etc.
*   **complete**, in that it should give access to all info in the source
    document

_But it’s not:_

*   something that creates HTML and the like: other projects use micromark for
    that
*   something that creates a syntax tree: remark will use it to do just that

## How it’ll be used

**micromark will be part of [unified][]**.
But it will likely not be something you’d directly interact with, unless
you’re interested in working on parsers, but it will make high-level tooling
better.

Evolving unified shouldn’t just be about new high-level features but also about
rethinking core mechanisms.
**That’s where micromark comes in, so unified can build the most friendly, secure,
fast, and extensive bridges between content formats.**

* * *

<p align="center">🎉 <strong>micromark is part of the unified collective!</strong> 🎉</p>
<p align="center"><a href="https://medium.com/unifiedjs/collectively-evolving-through-crowdsourcing-22c359ea95cc">Read more about it on Medium »</a></p>

[remark]: https://github.com/remarkjs/remark

[unified]: https://github.com/unifiedjs/unified

[lexer]: https://en.wikipedia.org/wiki/Lexical_analysis
