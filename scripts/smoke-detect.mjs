import { detectCourse, detectForm } from '../lib/courses.js'
for (const s of ['求 f(x)=x^3-3x 在 [-1,3] 上的最大值。', '求矩阵 A 的秩', '已知传递函数 G(s)，求闭环', '试证明图 2-49 的电网络', '请简述细胞膜的流动镶嵌模型']) console.log(detectCourse(s).padEnd(12), detectForm(s).padEnd(9), s.slice(0, 24))
