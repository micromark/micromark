module.exports = test

var fromCharCode = require('../constant/from-char-code')

function test(expression) {
  return characterTest
  function characterTest(code) {
    return expression.test(fromCharCode(code))
  }
}
