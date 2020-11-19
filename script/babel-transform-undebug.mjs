// Mini script for us to remove `debug` calls, based on `unassert`.
export default undebug

function undebug() {
  return {
    visitor: {
      ImportDeclaration: ImportDeclaration,
      AssignmentExpression: assignmentExpression,
      CallExpression: callExpression,
      VariableDeclarator: variableDeclarator
    }
  }
}

function ImportDeclaration(p, state) {
  if (p.node.source.value === 'debug') {
    p.remove()
  }
}

function assignmentExpression(nodePath) {
  if (
    nodePath.equals('operator', '=') &&
    isRequireDebug(nodePath.get('left'), nodePath.get('right'))
  ) {
    nodePath.remove()
  }
}

function callExpression(nodePath) {
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

function variableDeclarator(nodePath) {
  if (isRequireDebug(nodePath.get('id'), nodePath.get('init'))) {
    nodePath.remove()
  }
}

function isRequireDebug(id, init) {
  return (
    id.isIdentifier() && id.equals('name', 'debug') && init.isCallExpression()
  )
}
