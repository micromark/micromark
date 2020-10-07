import {Tokenizer, Construct, Event} from '../shared-types'

declare function resolveAll(
  constructs: Construct[],
  events: Event[],
  context: Tokenizer
): Event[]

export default resolveAll
