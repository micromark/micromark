import {Event} from '../../shared-types'

declare function subtokenize(events: Event[]): {done: boolean; events: Event[]}

export = subtokenize
