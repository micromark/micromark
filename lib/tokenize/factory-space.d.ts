import {Code} from '../character/codes'
import {Type} from '../constant/types'
import {Effects, Okay} from '../shared-types'

type Space = (code: Code) => ReturnType<Okay>

declare function createSpace(
  effects: Effects,
  ok: Okay,
  type: Type,
  max: number
): Space

export default createSpace
