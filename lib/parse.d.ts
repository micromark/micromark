import {Parser} from '../shared-types'

declare namespace createParser {
  interface ParserOptions {
    extensions: unknown[]
  }
}

declare function createParser(options?: createParser.ParserOptions): Parser

export = createParser
