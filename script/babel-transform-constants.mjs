export default transform

import path from 'path'
import resolveFrom from 'resolve-from'
import codes from '../lib/character/codes.js'
import values from '../lib/character/values.js'
import constants from '../lib/constant/constants.js'
import types from '../lib/constant/types.js'

var supported = [
  'micromark/lib/character/codes.js',
  'micromark/lib/character/values.js',
  'micromark/lib/constant/constants.js',
  'micromark/lib/constant/types.js'
]

var evaluated = [codes, values, constants, types]

function transform() {
  return {
    visitor: {
      ImportDeclaration: ImportDeclaration,
      VariableDeclaration: VariableDeclaration,
      MemberExpression: MemberExpression
    }
  }

  function ImportDeclaration(p, state) {
    var dirname = path.dirname(state.filename)
    var id
    var actual
    var local
    var position

    actual = resolveFrom(dirname, p.node.source.value)
    p.node.specifiers.forEach((specifier) => {
      if (specifier.type === 'ImportDefaultSpecifier') {
        id = specifier.local.name
      } else {
        throw Error(
          'Unknown specifier "' + specifier.type + '" in "' + p.toString() + '"'
        )
      }
    })
    actual = actual.slice(actual.lastIndexOf('micromark/'))
    position = supported
      .map((s) => s.slice(s.lastIndexOf('micromark/')))
      .indexOf(actual)

    if (position > -1) {
      // Save identifier.
      local = state.constantLocalIds || (state.constantLocalIds = {})
      local[id] = position

      // Remove the whole thing.
      p.remove()
    }
  }

  function VariableDeclaration(p, state) {
    var dirname = path.dirname(state.filename)
    var declarations = p.node.declarations
    var declaration = declarations[0]
    var id
    var actual
    var local
    var position

    if (
      declarations.length === 1 &&
      declaration.init &&
      declaration.init.type === 'CallExpression' &&
      declaration.init.callee &&
      declaration.init.callee.type === 'Identifier' &&
      declaration.init.callee.name === 'require' &&
      declaration.init.arguments.length === 1 &&
      declaration.init.arguments[0].type === 'StringLiteral'
    ) {
      id = declaration.id.name
      actual = resolveFrom(dirname, declaration.init.arguments[0].value)
      actual = actual.slice(actual.lastIndexOf('micromark/'))
      position = supported
        .map((s) => s.slice(s.lastIndexOf('micromark/')))
        .indexOf(actual)

      if (position > -1) {
        // Save identifier.
        local = state.constantLocalIds || (state.constantLocalIds = {})
        local[id] = position

        // Remove the whole thing.
        p.remove()
      }
    }
  }

  function MemberExpression(p, state) {
    var objectName = p.node.object.name
    var propertyName = p.node.property.name
    var exported
    var value
    var type

    if (state.constantLocalIds && objectName in state.constantLocalIds) {
      exported = evaluated[state.constantLocalIds[objectName]]

      if (propertyName in exported) {
        value = exported[propertyName]

        type =
          typeof value === 'string'
            ? 'String'
            : typeof value === 'number'
            ? 'Numeric'
            : typeof value === 'boolean'
            ? 'Boolean'
            : value === null
            ? 'Null'
            : undefined

        if (!type) {
          throw new Error(
            'Unexpected non-literal `' +
              value +
              '` in at `' +
              propertyName +
              '` in `' +
              objectName +
              '`'
          )
        }

        p.replaceWith({type: type + 'Literal', value: value})
      } else {
        throw new Error(
          'Unknown field `' + propertyName + '` in `' + objectName + '`'
        )
      }
    }
  }
}
