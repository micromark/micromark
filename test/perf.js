import {readFile} from 'node:fs/promises'
import {micromark} from 'micromark'
import ms from 'ms'

const readme = await readFile('readme.md', 'utf8')

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

console.log('readme x1000')
then = Date.now()
for (let i = 0; i < 1000; i++) {
  micromark(readme)
}

console.log(ms(Date.now() - then))
