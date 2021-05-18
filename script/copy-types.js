// This script will copy all `.d.ts` files from `lib/` into `dist/`

import {promises as fs} from 'fs'
import path from 'path'
import glob from 'glob'

main()

async function main() {
  const root = process.cwd()
  const dist = path.join(root, 'dist')
  const files = glob.sync('**/*.d.ts', {cwd: path.join(root, 'lib')})
  let index = -1

  while (++index < files.length) {
    await fs.mkdir(path.dirname(path.join(dist, files[index])), {
      recursive: true
    })
    await fs.copyFile(
      path.join(root, 'lib', files[index]),
      path.join(dist, files[index])
    )
  }
}
