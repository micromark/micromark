import fromCharCode from '../constant/from-char-code'

export default function whitespace(code: number) {
  return /\s/.test(fromCharCode(code));
}
