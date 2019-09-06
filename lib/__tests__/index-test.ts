import {Tokenizer} from '../'

describe('index', () => {
  let logs: any[] = []
  const mockLogger = jest.fn((...args) => logs.push(args))
  const originalLogger = console.log

  beforeEach(() => {
    logs = []
    console.log = mockLogger
  })

  afterEach(() => {
    console.log = originalLogger
  })

  it('should parse paragraphs', () => {
    const tokenizer = new Tokenizer()
    tokenizer.write('Alpha\n\nBravo')
    tokenizer.end()
    expect(logs).toMatchSnapshot()
  })

  it('should parse an ATX heading', () => {
    const tokenizer = new Tokenizer()
    tokenizer.write('# Hello!')
    tokenizer.end()
    expect(logs).toMatchSnapshot()
  })

  it('should parse indented code', () => {
    const tokenizer = new Tokenizer()
    tokenizer.write('    Alpha\n\t\n\tBravo\nParagraph')
    tokenizer.end()
    expect(logs).toMatchSnapshot()
  })

  it('should parse thematic breaks', () => {
    const tokenizer = new Tokenizer()
    tokenizer.write(' -     -      -      - ')
    tokenizer.end()
    expect(logs).toMatchSnapshot()
  })

  it('should parse partial data', () => {
    const runTokenizer = (dataStream: string[]) => {
      const tokenizer = new Tokenizer()
      for (const data of dataStream) {
        tokenizer.write(data)
      }
      tokenizer.end()
    }
    runTokenizer(['#', '# Hello,', ' Wor', 'ld!'])
    const firstLogs = logs
    // TODO use something else than logs
    logs = []
    runTokenizer(['## Hello, World!'])
    expect(logs).toEqual(firstLogs)
  })
})
