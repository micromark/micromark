import fromCharCode from '../constant/from-char-code'

export default function asciiAlphanumeric(code: number) {
  return /[\dA-Za-z]/.test(fromCharCode(code));
}
