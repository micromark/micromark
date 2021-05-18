import {assign} from '../constant/assign.js'

/**
 * @template {unknown} T
 * @param {T} object
 * @returns {T}
 */
export function shallow(object) {
  return assign({}, object)
}
