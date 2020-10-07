import {SyntaxExtension} from '../shared-types'

declare function combineExtensions(
  extensions: SyntaxExtension[]
): SyntaxExtension

export default combineExtensions
