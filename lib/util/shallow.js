var assign = require('../constant/assign')

module.exports = shallow

function shallow(object) {
  return assign({}, object)
}
