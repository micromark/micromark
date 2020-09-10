import * as codes from './codes'

export default function markdownSpace(code: number) {
  return (
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
