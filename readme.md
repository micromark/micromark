# micromark

Hey folks! 👋
Welcome to micromark: a new, tiny, and fast, markdown parser written in
TypeScript under the [unified umbrella][unified] that’s different.
(And just an idea, for now.)

---

> 💁🏽‍♀️ [**Did you see our blog post announcing this? It’s a great introduction**][medium]

---

## What’s micromark

**micromark** is a super low-level markdown parser in JavaScript. In nerdy terms, it’s a lexer 👩🏽‍🏫

### 💁🏽‍♀️ It is

*   [x] **small** in file size
*   [x] **tiny** in memory use
*   [x] **fast** in speed
*   [x] **safe** to use
*   [x] **compliant** to commonmark
*   [x] **extendible** to support gfm and mdx
*   [x] **complete** in that it’s possible to construct a CST

### 🤷🏽‍♀️ It could be

*   [ ] **streaming** (for big files, this has some complexity downsides, but it may be interesting)

### 🙅🏽‍♀️ It’s not

*   something that creates HTML and the like; other projects can use micromark for that
*   something that creates a syntax tree; remark will use micromark to do that


## 👯‍♀️ We need your help

We’d love to make micromark into reality, but we need your help.
Either through ideas, code contributions, or through [open collective][collective].

[unified]: https://github.com/unifiedjs/unified

[collective]: https://opencollective.com/unified

[medium]: https://medium.com/unifiedjs/collectively-evolving-through-crowdsourcing-22c359ea95cc
