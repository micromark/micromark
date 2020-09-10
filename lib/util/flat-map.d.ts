/**
 * @param array array to flatten
 * @param map mapping function
 * @param a passed to map function
 * @typeParam T shape of item input to flatMap
 * @typeParam U shape of item returned by flatMap
 * @typeParam A shape of additional attribute passed
 */
declare function flatMap<T, U, A>(
  array: T[][],
  map: (array: T[], a: A) => U[],
  a?: A
): U[]

export = flatMap
