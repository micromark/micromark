// This script will read constants from `.js` files and generate `.d.ts` files.

import fs from 'fs'
import path from 'path'
import codes from '../lib/character/codes.mjs'
import values from '../lib/character/values.mjs'
import types from '../lib/constant/types.mjs'
import constants from '../lib/constant/constants.mjs'

function generateTyping(name, object, basePath) {
  var uniqueValues = Array.from(new Set(Object.values(object)))
  var literalType = uniqueValues
    .map((value) => JSON.stringify(value))
    .join(' | ')
  var interfaceType = JSON.stringify(object)

  // Special logic for "Type" since we want to have types extendable btw, e.g., micromark-extension-gfm adds other types.
  if (name === 'Type') {
    literalType = 'string'
  }

  // Special logic for "Code" since a `Code` value can be any unicode character.
  if (name === 'Code') {
    literalType = 'null | number'
  }

  fs.writeFileSync(
    basePath + '.d.ts',
    [
      '// This module is generated by `script/`.',
      '',
      `export type ${name} = ${literalType}`,
      '',
      '// @for-script: REMOVE_ALL_THING_BELOW',
      '',
      `export interface ${name}s ${interfaceType}`,
      '',
      `declare const value: ${name}s`,
      '',
      `export default value`,
      ''
    ].join('\n')
  )
}

generateTyping('Code', codes, path.join('lib', 'character', 'codes'))
generateTyping('Value', values, path.join('lib', 'character', 'values'))
generateTyping('Type', types, path.join('lib', 'constant', 'types'))
generateTyping('Constant', constants, path.join('lib', 'constant', 'constants'))
