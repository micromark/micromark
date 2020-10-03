declare function chunkedSplice<T>(
  list: T[],
  start: number,
  remove: number,
  items: T[]
): T[]

export default chunkedSplice
