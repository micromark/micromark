var fromCharCode = String.fromCharCode

module.exports = test

function test(expression) {
  return characterTest
  function characterTest(code) {
    return expression.test(fromCharCode(code))
  }
}
