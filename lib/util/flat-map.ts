// Note: `a` could be given here, which is then passed to the map function.
// It functions as a rest/spread, but smaller.
export default function flatMap<T, A>(array: T[][], map: (items: T[], a: A) => T[], a: A): T[] {
  var length = array.length
  var index = -1
  var result: T[] = []

  while (++index < length) {
    result = result.concat(map(array[index], a))
  }

  return result
}
