# SPEC · dsh-studygo 数据格式 v0.1

> 这是**唯一的事实来源**。代码、导入器、导出器都按它来；改格式必须改这个文件。

## 1. 目录结构

```
vault/
├── <库名>/
│   ├── index.md            库说明（frontmatter + 知识卡）
│   ├── q-20261107-0001.md  题目卡
│   └── ...
├── 附件/
│   └── 2026-11/q-....png   题图，按题目 id 命名
└── .index/
    └── study.db            SQLite FTS5 索引（可删，重建）
```

- 库名可含中文，但禁止 `\ / : * ? " < > |`；同名库不加数字后缀，视为同一个库。
- 题目文件名 = 题目 id，永不重命名。

## 2. 库：index.md

```markdown
---
title: 数学-导数
created: 2026-11-07
updated: 2026-11-07
kind: library
subject: 数学
source: 自建
---

# 数学-导数

## 知识卡

### 极值点
- 定义：f'(x)=0 且左右变号
- 易错：闭区间最值还要比端点
```

`subject` / `source` 可空。`## 知识卡` 下每个 `###` 是一个概念，正文是若干要点。

## 3. 题目卡：q-YYYYMMDD-NNNN.md

```markdown
---
id: q-20261107-0001
library: 数学-导数
title: 三次函数在闭区间上的最值
created: 2026-11-07
updated: 2026-11-07
topic: [导数, 闭区间最值]
difficulty: 中
source_book: 2024 全国甲卷
source_page: 12
source_no: T21
---

## 题干

已知 f(x)=x³−3x，求 f 在 [−2,2] 上的最大值与最小值。

## 步骤

### S1 求导
- 意图：把最值问题化为驻点问题
- 关键式：f'(x)=3x²−3

f'(x)=3x²−3=3(x−1)(x+1)

### S2 驻点
- 意图：找出所有可能取最值的点
- 关键式：x=±1

令 f'(x)=0，得 x=±1。

## 追问

- @S1 为什么一定要先求导？
  - 闭区间上最值只可能在驻点或端点取得。
```

### 规则

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | `q-YYYYMMDD-NNNN`，全局唯一 |
| `library` | ✅ | 所属库名 |
| `title` | ❌ | 缺省取题干首行前 30 字 |
| `topic` | ❌ | 知识点数组，`[a, b]`（L1） |
| `method` | ❌ | 步骤方法的有序数组，如 `[derivation, critical_point]`（L2，见 §6.1） |
| `difficulty` | ❌ | 易 / 中 / 难 |
| `source_*` | ❌ | 来源，用于「参考模式」标出处 |

### 步骤块

- 以 `### S<n> <短标题>` 开始，`n` 从 1 递增；
- `- 方法：` 一行，取自 §6.1 的受控词表（L2，缺省 `other`）；
- `- 意图：` 一行说明这步在干什么（这是追问锚点的语义）；
- `- 关键式：` 可选，允许单独挂追问；
- 其余内容是该步正文，原样保留，不改写；
- **没有步骤是合法的**（导入的题库常常只有答案）。

### 追问块

- 二级列表：`- @S1 问题` 是挂在 S1 上的一个追问；
- 缩进 2 空格再写 `- 回答` 即为一层；继续缩进即继续分叉；
- `@S1` 可换成 `@Q`（挂整题）或 `@式`（挂关键式）；
- 追问若被「升级为对比」，记录形式见 §6.3。

## 4. 索引

SQLite（`node:sqlite`，零依赖）：

```sql
CREATE TABLE libs (name TEXT PRIMARY KEY, subject TEXT, updated TEXT, count INTEGER);
CREATE TABLE questions (id TEXT PRIMARY KEY, lib TEXT, title TEXT, body TEXT, topic TEXT, updated TEXT);
CREATE VIRTUAL TABLE q_fts USING fts5(id UNINDEXED, title, body, topic, tokenize='unicode61');
CREATE VIRTUAL TABLE c_fts USING fts5(lib UNINDEXED, concept, body, tokenize='unicode61');
```

- 写入时同步更新；索引与文件不一致时以文件为准，重建即可；
- 检索默认返回题目 + 命中的概念，供「相关题」使用。

## 5. 迁移

- `formatVersion` 写在库的 frontmatter；当前为 1。
- 读旧版本时按字段缺省容忍，不报错。

---

## 6. 记忆：四层结构与关联

> 目的是「题与题之间的关系」，不是「聊过什么」。L2 是地基，缺了它只能靠字面相似。

| 层 | 名字 | 载体 | 说明 |
|---|---|---|---|
| L0 | 题目原文 | 题目 md | 已经是真源 |
| L1 | 知识点 | frontmatter `topic` + 概念索引 | 轻量标签，跨库共享 |
| L2 | 解法骨架 | frontmatter `method` + 每步 `- 方法：` | **受控词表**，用于判「同套路」 |
| L3 | 库知识卡 | 库 `index.md` 的 `## 知识卡` | 人类可编辑，每库 ≤ 30 张 |

### 6.1 步骤的方法标签（L2）

每个步骤必须带一个 `- 方法：<label>`，来自下面的受控词表。**只认词表内的值**，未知值写入时报警并用 `other` 兜底。

```
derivation        求导
factorization     因式分解
completion        配方
substitution      换元
inequality        解不等式
sign_analysis     判号（列表/数轴）
critical_point    找驻点/极值点
endpoint_compare  端点与驻点比较
monotonicity      单调性讨论
tangent_line      切线方程
sequence_term     求通项
telescoping       裂项相消
sum_formula       求和公式
induction         数学归纳
force_analysis    受力分析
newton_second     牛顿第二定律
momentum          动量守恒
energy            能量守恒
circuit_ohm       闭合电路欧姆定律
probability_dist  分布列
expectation       期望计算
classification    分类讨论
construction      构造辅助量
other             其他
```

题目整体的 `method` 字段 = 步骤方法的**有序数组**，用于骨架相似度：

```yaml
method: [derivation, critical_point, endpoint_compare]
```

相似度：两题 `method` 序列的最长公共子序列 / 较长者长度 ≥ 0.6 视为**同套路**。

### 6.2 关联三型

| 类型 | key | 判定 | 教学价值 |
|---|---|---|---|
| 同考点 | `same-topic` | `topic` 交集非空 | 低 |
| 同套路 | `same-method` | 骨架相似度 ≥ 0.6 | 中 |
| 形似神不似 | `false-friend` | 题干/题型相似但骨架相似度 < 0.4 | **高** |

三类**都不落盘**，每次按需计算；只有用户的反馈和固定链接落盘（见 6.4）。

### 6.3 对比卡（L3 的一种）

存在库 `index.md` 的 `## 知识卡` 段里，标题以 `[对比]` 开头，正文第一行写两题 id：

```markdown
### [对比] 三次函数：闭区间 vs 开区间
对比: q-20261107-0091 ⇄ q-20261107-0012

- 共同骨架：求导 → 驻点
- 分岔点：闭区间要代端点，开区间不用
- 学生常错：把开区间的端点也代进去
```

### 6.4 用户反馈（唯一落盘的关联数据）

`vault/.meta/links.json`：

```json
{
  "version": 1,
  "deny": ["q-20261107-0091|q-20261107-0012"],
  "pins": [
    { "a": "q-20261107-0091", "b": "q-20261107-0012", "kind": "false-friend", "note": "开闭区间" }
  ]
}
```

- `deny`：pair key 用 `a|b`（字典序小在前），**永久不再出现**；
- `pins`：用户手动固定/新建的关联，优先于自动计算。

### 6.5 记忆注入（生成讲解时）

| 项 | 规则 |
|---|---|
| 预算 | 最多 3 条关联 + 2 张知识卡，合计 ≤ 800 token |
| 同库 | 自动注入 |
| 跨库 | 只进「推荐」，不自动注入 |
| 形态 | 必须写成**贴着某一步的一句话**，带 `[[q-id]]` 引用，不能是末尾的泛泛总结 |
| 可见 | 讲解底部有「来源条」：引用了 N 道题 / N 张卡，可点开 |

### 6.6 记忆强度档

写在库 frontmatter：

```yaml
memory: same-library   # off | same-library | cross-library
```

默认 `same-library`。`off` 时不做任何关联计算与注入。

### 6.7 重整

- 每库知识卡 > 30 张时触发合并（同主题并卡，保留最近的例子）；
- 合并前自动备份 `index.md` 为 `index.md.bak-YYYYMMDD`；
- 合并只由用户显式触发或夜间任务执行，不在写题时自动做。

## 7. 索引变更（v1 → v2）

```sql
ALTER TABLE questions ADD COLUMN method TEXT;   -- 空格分隔的 method 序列
CREATE TABLE IF NOT EXISTS concepts (
  name TEXT PRIMARY KEY,
  libs TEXT,          -- 逗号分隔的库名
  body TEXT,
  updated TEXT
);
```

`q_fts` 的 grams 列额外拼入 `method` 与 `topic`，保证「求导」这类方法词也搜得到。
