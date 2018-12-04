import { Tokenizer } from '../'

describe('index', () => {
  let logs = []
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
    expect(logs).toMatchSnapshot()
  })
})
