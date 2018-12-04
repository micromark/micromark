// convoluted example to show different compilation targets
// are respected
export default function(a: number, b: number): number {
  const id = (x: any) => x
  return id(a) + id(b)
}

// examples below to check if the correct libs are loaded up
// in your respective editors

// array.includes is from lib.es2016
export function includes<T>(v: T, arr: T[]): boolean {
  return arr.includes(v)
}

// padStart and padEnd are from lib.es2017
export function padString(inputString: string, maxLength: number, fillWith?: string): string {
  const strLen = inputString.length

  return inputString
    .padStart(strLen + Math.floor(maxLength / 2), fillWith)
    .padEnd(strLen + maxLength, fillWith)
}

// Promise.finally is from lib.2018
export function addFinally(promise: Promise<number>, cb: () => void) {
  return promise.finally(cb)
}
