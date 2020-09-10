import fromCharCode from '../constant/from-char-code'

export default function asciiDigit(code: number) {
  return /\d/.test(fromCharCode(code));
}
