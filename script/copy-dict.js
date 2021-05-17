// This script will copy all `.d.ts` files from `lib/` into `dist/`

import fs from 'fs'
import path from 'path'
import glob from 'glob'

const root = process.cwd()
const dist = path.join(root, 'dist')

const files = glob.sync('**/*.d.ts', {cwd: path.join(root, 'lib')})
let index = -1
let doc
let position

while (++index < files.length) {
  doc = String(fs.readFileSync(path.join(root, 'lib', files[index])))
  position = doc.indexOf('// @for-script: REMOVE_ALL_THING_BELOW')

  fs.mkdirSync(path.dirname(path.join(dist, files[index])), {recursive: true})
  fs.writeFileSync(
    path.join(dist, files[index]),
    position < 0 ? doc : doc.slice(0, position)
  )
}
