var assign = require('../constant/assign')

module.exports = clonePoint

function clonePoint(point) {
  return assign({}, point)
}
