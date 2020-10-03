import {BufferEncoding} from 'lib/shared-types'

type PreprocessReturn = (
  value: string,
  encoding: BufferEncoding,
  end?: boolean
) => string[]

declare function preprocess(): PreprocessReturn

export default preprocess
