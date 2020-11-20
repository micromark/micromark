import ms from 'ms'
import m from '../index.mjs'

console.log('base')
var then = Date.now()
m('xxxx'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('strong')
then = Date.now()
m('a**b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('strong/emphasis?')
then = Date.now()
m('a**b' + 'c*'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('unclosed links')
then = Date.now()
m('[a](b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('unclosed links (2)')
then = Date.now()
m('[a](<b'.repeat(1e4))
console.log(ms(Date.now() - then))

console.log('tons of definitions')
then = Date.now()
m('[a]: u\n'.repeat(1e4))
console.log(ms(Date.now() - then))
