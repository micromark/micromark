import { expect } from 'chai'
import sum from '../../../lib'

describe('index#default', () => {
  it('should return the sum of given input numbers', () => {
    expect(sum(2, 3)).to.equal(5)
  })
})
