import assign from '../constant/assign'

export default function shallow<T>(object: T): T {
  return assign({}, object)
}
