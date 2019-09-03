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
  it('should parse simple example', () => {
    const tokenizer = new Tokenizer()
    tokenizer.write('# Hello!')
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
