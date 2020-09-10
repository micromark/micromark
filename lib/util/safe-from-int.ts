import * as codes from '../character/codes'
import * as values from '../character/values'
import fromCharCode from '../constant/from-char-code'

export default function safeFromInt(value: string, base?: number) {
  var code = parseInt(value, base)

  if (
    // Control codes.
    code < codes.ht ||
    code === codes.vt ||
    (code > codes.cr && code < codes.space) ||
    (code > codes.tilde && code < 160) ||
    // Never used.
    (code > 55295 && code < 57344) ||
    (code > 64975 && code < 65008) ||
    (code & 65535) === 65535 ||
    (code & 65535) === 65534 ||
    // Out of range
    code > 1114111
  ) {
    return values.replacementCharacter
  }

  return fromCharCode(code)
}
