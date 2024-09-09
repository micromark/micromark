// This script creates an index file for micromark that intercepts micromark’s
// buffering API to capture all passed strings, but otherwise works just like
// micromark.
// Then, it runs the test suite to capture those strings.
// Finally, it writes those given strings to `test/fixtures/` as separate files.
// This can then be used to feed the fuzz tester.

import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import {promisify} from 'node:util'

const exec = promisify(childProcess.exec)

await fs.rename(
  new URL('../packages/micromark/index.js', import.meta.url),
  new URL('../packages/micromark/index.bak.js', import.meta.url)
)

await fs.writeFile(
  new URL('../packages/micromark/index.js', import.meta.url),
  [
    'export {compile} from "./lib/compile.js"',
    'export {parse} from "./lib/parse.js"',
    'export {postprocess} from "./lib/postprocess.js"',
    'export {preprocess} from "./lib/preprocess.js"',
    'export {micromark}',
    'import fs from "node:fs"',
    'import path from "node:path"',
    'import {micromark as core} from "./index.bak.js"',
    'const captured = []',
    'const base = path.join("test", "fixtures")',
    'process.on("exit", onexit)',
    'fs.mkdirSync(base, {recursive: true})',
    'function micromark(value) {',
    '  console.log(...arguments)',
    '  if (typeof value === "string") captured.push(value)',
    '  return core(...arguments)',
    '}',
    'function onexit() {',
    '  captured',
    '    .sort()',
    '    .filter(function (d, i, a) { return a.indexOf(d) === i })',
    '    .forEach(function (d, i) { fs.writeFileSync(',
    '      path.join(base, String(i)),',
    '      d',
    '    ) })',
    '}'
  ].join('\n')
)

await exec('node test/index.js')

await fs.rename(
  new URL('../packages/micromark/index.bak.js', import.meta.url),
  new URL('../packages/micromark/index.js', import.meta.url)
)
