module.exports = entries

var own = require('../constant/has-own-property')

function entries(object) {
  var key

  for (key in object) {
    /* istanbul ignore else - Polution. */
    if (own.call(object, key)) {
      return true
    }
  }

  return false
}
