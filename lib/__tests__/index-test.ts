import sum, { padString } from '../'

describe('index', () => {
  describe('#default', () => {
    it('should return the sum of given input numbers', () => {
      expect(sum(2, 3)).toBe(5)
    })
  })
  describe('#padString', () => {
    it('should pad a string evenly on both ends when given an even max length', () => {
      expect(padString('12', 4, 'o')).toBe('oo12oo')
    })
    it('should pad a string unevenly with preference given to the end when given an odd max length', () => {
      expect(padString('12', 5, 'o')).toBe('oo12ooo')
    })
  })
})
