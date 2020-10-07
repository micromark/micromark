import {Code} from 'dist/character/codes'

declare function regexCheck(regex: RegExp): (code: Code) => boolean

export default regexCheck
