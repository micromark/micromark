import {Type} from 'lib/constant/types'
import {Event} from '../shared-types'

declare function prefixSize(events: Event[], type: Type): number

export default prefixSize
