var path = require('path')
var resolveFrom = require('resolve-from')
var characters = require('../lib/util/characters')

module.exports = transform

var expected = require.resolve('../lib/util/characters')

function transform() {
  return {
    visitor: {
      VariableDeclaration(p, state) {
        var dirname = path.dirname(state.filename)
        var declarations = p.node.declarations
        var declaration = declarations[0]
        var id
        var actual

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

          if (expected === actual) {
            // Save identifier.
            state.charactersLocalName = id

            // Remove the whole thing.
            p.remove()
          }
        }
      },

      MemberExpression(p, state) {
        var name

        if (
          state.charactersLocalName !== undefined &&
          p.node.object.name === state.charactersLocalName
        ) {
          name = p.node.property.name

          if (name in characters) {
            p.replaceWith({type: 'NumericLiteral', value: characters[name]})
          } else {
            throw new Error('Unknown character `' + name + '`')
          }
        }
      }
    }
  }
}
