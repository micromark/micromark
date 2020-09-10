// Mini script for us to remove `debug` calls, based on `unassert`.
'use strict'

module.exports = undebug

function undebug() {
  return {
    visitor: {
      AssignmentExpression: assignmentExpression,
      CallExpression: callExpression,
      VariableDeclarator: variableDeclarator
    }
  }
}

function assignmentExpression(nodePath: any) {
  if (
    nodePath.equals('operator', '=') &&
    isRequireDebug(nodePath.get('left'), nodePath.get('right'))
  ) {
    nodePath.remove()
  }
}

function callExpression(nodePath: any) {
  var callee = nodePath.get('callee')

  if (
    nodePath.parentPath &&
    nodePath.parentPath.isExpressionStatement() &&
    callee.isIdentifier() &&
    callee.equals('name', 'debug')
  ) {
    nodePath.remove()
  }
}

function variableDeclarator(nodePath: any) {
  if (isRequireDebug(nodePath.get('id'), nodePath.get('init'))) {
    nodePath.remove()
  }
}

function isRequireDebug(id: any, init: any) {
  return (
    id.isIdentifier() && id.equals('name', 'debug') && init.isCallExpression()
  )
}
