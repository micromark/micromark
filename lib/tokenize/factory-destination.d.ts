import {Code} from '../character/codes'
import {Type} from '../constant/types'
import {Effects, NotOkay, Okay} from '../shared-types'

type Destination = (code: Code) => Destination

declare function createDestination(
  effects: Effects,
  ok: Okay,
  nok: NotOkay,
  type: Type,
  literalType: Type,
  literalMarkerType: Type,
  rawType: Type,
  stringType: Type,
  max: number
): Destination

export default createDestination
