import { verifyEquations } from '../lib/verify.js'
const r = await verifyEquations(['f(-2) = -8 + 6 = -2', '3x^2 - 3 = 3(x-1)(x+1)', 'x^2 = x * x + 1'], { script: 'E:/DSH题库插件/plugin/scripts/verify.py' })
console.log(JSON.stringify(r, null, 1))
