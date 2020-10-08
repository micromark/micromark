import {Effects, Tokenize} from '../shared-types'

export const tokenize: Tokenize
export const continuation: {tokenize: Tokenize}
export function exit(effects: Effects): void
