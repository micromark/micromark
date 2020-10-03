import {Chunk, Token} from '../shared-types'

declare function sliceChunks(chunks: Chunk[], token: Token): string[]

export default sliceChunks
