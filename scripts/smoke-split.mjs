import { splitQuestions } from '../lib/host.js'
const one = '1. 求极限 lim(x->0) sin x / x 2. 计算定积分 x dx 3. 讨论函数单调性'
console.log(JSON.stringify(splitQuestions(one).map(x => x.text)))
const two = '1. 求极限\n2. 求导\n3. 积分'
console.log(JSON.stringify(splitQuestions(two).map(x => x.text)))
