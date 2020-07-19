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

  /* istanbul ignore next - Not used yet, but might become useful if constructs
   * are removed. */
  return false
}
