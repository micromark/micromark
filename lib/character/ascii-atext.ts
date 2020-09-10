import fromCharCode from '../constant/from-char-code'

// Also includes dot.
export default function asciiAtext(code: number) {
  return /[#-'*+\--9=?A-Z^-~]/.test(fromCharCode(code));
}
