var path = require('path')
var resolveFrom = require('resolve-from')
var codes = require('../lib/character/codes')

module.exports = transform

var expected = require.resolve('../lib/character/codes')

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
            state.characterCodesLocalName = id

            // Remove the whole thing.
            p.remove()
          }
        }
      },

      MemberExpression(p, state) {
        var name

        if (
          state.characterCodesLocalName !== undefined &&
          p.node.object.name === state.characterCodesLocalName
        ) {
          name = p.node.property.name

          if (name in codes) {
            p.replaceWith({type: 'NumericLiteral', value: codes[name]})
          } else {
            throw new Error('Unknown character `' + name + '`')
          }
        }
      }
    }
  }
}
