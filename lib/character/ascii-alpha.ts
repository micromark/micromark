import fromCharCode from '../constant/from-char-code'

export default function asciiAlpha(code: number) {
  return /[A-Za-z]/.test(fromCharCode(code));
}
