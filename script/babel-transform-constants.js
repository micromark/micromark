var path = require('path')
var resolveFrom = require('resolve-from')

module.exports = transform

var supported = [
  require.resolve('../lib/character/codes'),
  require.resolve('../lib/character/values'),
  require.resolve('../lib/constant/constants'),
  require.resolve('../lib/constant/types')
]

var evaluated = supported.map(function (filePath) {
  return require(filePath)
})

function transform() {
  return {
    visitor: {
      VariableDeclaration(p, state) {
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
          position = supported.indexOf(actual)

          if (position !== -1) {
            // Save identifier.
            local = state.constantLocalIds || (state.constantLocalIds = {})
            local[id] = position

            // Remove the whole thing.
            p.remove()
          }
        }
      },

      MemberExpression(p, state) {
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
  }
}
