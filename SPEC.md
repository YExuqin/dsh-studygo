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
| `topic` | ❌ | 知识点数组，`[a, b]` |
| `difficulty` | ❌ | 易 / 中 / 难 |
| `source_*` | ❌ | 来源，用于「参考模式」标出处 |

### 步骤块

- 以 `### S<n> <短标题>` 开始，`n` 从 1 递增；
- `- 意图：` 一行说明这步在干什么（这是追问锚点的语义）；
- `- 关键式：` 可选，允许单独挂追问；
- 其余内容是该步正文，原样保留，不改写；
- **没有步骤是合法的**（导入的题库常常只有答案）。

### 追问块

- 二级列表：`- @S1 问题` 是挂在 S1 上的一个追问；
- 缩进 2 空格再写 `- 回答` 即为一层；继续缩进即继续分叉；
- `@S1` 可换成 `@Q`（挂整题）或 `@式`（挂关键式）。

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
