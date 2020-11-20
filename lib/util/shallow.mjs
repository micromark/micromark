export default shallow

import assign from '../constant/assign'

function shallow(object) {
  return assign({}, object)
}
