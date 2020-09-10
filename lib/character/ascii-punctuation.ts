import fromCharCode from '../constant/from-char-code'

export default function asciiPunctuation(code: number) {
  return /[!-/:-@[-`{-~]/.test(fromCharCode(code));
}
