import {micromark} from 'micromark'

console.log(micromark('List1\n* item1\n* item2\n\n\n\n'))
console.log(micromark('List1\n* item1\n* item2\n\n\n \n'))
