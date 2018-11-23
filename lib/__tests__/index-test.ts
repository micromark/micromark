import sum from '../'

describe('index#default', () => {
  it('should return the sum of given input numbers', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
