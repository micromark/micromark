export default transform

import module from 'module'
import path from 'path'
import resolveFrom from 'resolve-from'

// eslint-disable-next-line node/no-deprecated-api -- Replace with regular imports after migrating lib to es modules
var requireUtil = module.createRequireFromPath(
  path.join(process.cwd(), './script/babel-transform-constants.mjs')
)
var codes = requireUtil('../lib/character/codes.js')
var values = requireUtil('../lib/character/values.js')
var constants = requireUtil('../lib/constant/constants.js')
var types = requireUtil('../lib/constant/types.js')

var supported = [
  path.join('micromark', 'lib', 'character', 'codes.js'),
  path.join('micromark', 'lib', 'character', 'values.js'),
  path.join('micromark', 'lib', 'constant', 'constants.js'),
  path.join('micromark', 'lib', 'constant', 'types.js')
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
        throw new Error(
          'Unknown specifier "' + specifier.type + '" in "' + String(p) + '"'
        )
      }
    })

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
