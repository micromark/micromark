var fromCharCode = require('../constant/from-char-code')

module.exports = test

function test(expression) {
  return characterTest
  function characterTest(code) {
    return expression.test(fromCharCode(code))
  }
}
