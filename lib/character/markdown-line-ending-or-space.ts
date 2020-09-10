import * as codes from './codes'

export default function markdownLineEndingOrSpace(code: number) {
  return (
    code === codes.carriageReturn ||
    code === codes.lineFeed ||
    code === codes.carriageReturnLineFeed ||
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
