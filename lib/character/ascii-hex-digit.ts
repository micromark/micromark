import fromCharCode from '../constant/from-char-code'

export default function asciiHexDigit(code: number) {
  return /[\dA-Fa-f]/.test(fromCharCode(code));
}
