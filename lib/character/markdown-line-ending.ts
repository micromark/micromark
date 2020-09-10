import * as codes from './codes'

export default function markdownLineEnding(code: number) {
  return (
    code === codes.carriageReturn ||
    code === codes.lineFeed ||
    code === codes.carriageReturnLineFeed
  )
}
