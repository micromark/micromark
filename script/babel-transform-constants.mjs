export default transform

import path from 'path'
import resolveFrom from 'resolve-from'
import codes from '../lib/character/codes.mjs'
import values from '../lib/character/values.mjs'
import constants from '../lib/constant/constants.mjs'
import types from '../lib/constant/types.mjs'

var supported = [
  path.join('micromark', 'lib', 'character', 'codes.mjs'),
  path.join('micromark', 'lib', 'character', 'values.mjs'),
  path.join('micromark', 'lib', 'constant', 'constants.mjs'),
  path.join('micromark', 'lib', 'constant', 'types.mjs')
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
    actual = actual.slice(actual.lastIndexOf('micromark' + path.sep))

    position = supported
      .map((s) => s.slice(s.lastIndexOf('micromark' + path.sep)))
      .indexOf(actual)

    if (position > -1) {
      p.node.specifiers.forEach((specifier) => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          id = specifier.local.name
        } else {
          throw new Error(
            'Unknown specifier "' + specifier.type + '" in "' + String(p) + '"'
          )
        }
      })

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
      actual = actual.slice(actual.lastIndexOf('micromark' + path.sep))
      position = supported
        .map((s) => s.slice(s.lastIndexOf('micromark' + path.sep)))
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
