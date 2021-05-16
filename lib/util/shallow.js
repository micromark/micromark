import {assign} from '../constant/assign.js'

export function shallow(object) {
  return assign({}, object)
}
