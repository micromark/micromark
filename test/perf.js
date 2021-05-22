import ms from 'ms'
import {micromark} from 'micromark'

console.log('base')
let then = Date.now()
micromark('xxxx'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('strong')
then = Date.now()
micromark('a**b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('strong/emphasis?')
then = Date.now()
micromark('a**b' + 'c*'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('unclosed links')
then = Date.now()
micromark('[a](b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('unclosed links (2)')
then = Date.now()
micromark('[a](<b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('tons of definitions')
then = Date.now()
micromark('[a]: u\n'.repeat(1e4))
console.log(ms(Date.now() - then))
