import {Parser, Point, Tokenizer} from '../../shared-types'

declare function createTokenizer(
  parser: Parser,
  initialize: unknown,
  from: Point
): Tokenizer

export = createTokenizer
