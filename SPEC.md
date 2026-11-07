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

> 正文结构由 `form` 决定，四种形态见 §9。下面以 `proof` 为例。

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
| `form` | ❌ | 答案形态：`proof` / `analysis` / `essay` / `diagram`，缺省按课程包（§9） |
| `course` | ❌ | 课程包 id，缺省继承库（§8） |
| `style` | ❌ | 书写档位：`strict` / `guided` / `free`，缺省按课程包（§9.5） |
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

每个步骤必须带一个 `- 方法：<id>`，取自**所属课程包**的方法词表（§8.1）。**只认该包内的值**，未知值写入时报警并用 `other` 兜底。下面这张是通用兜底表（`_default` 包的基础项），课程包可扩展或覆盖。

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
ALTER TABLE questions ADD COLUMN form TEXT;     -- proof / analysis / essay / diagram
ALTER TABLE questions ADD COLUMN course TEXT;   -- 课程包 id
CREATE TABLE IF NOT EXISTS concepts (
  name TEXT PRIMARY KEY,
  libs TEXT,          -- 逗号分隔的库名
  body TEXT,
  updated TEXT
);
```

`q_fts` 的 grams 列额外拼入 `method` 与 `topic`，保证「求导」这类方法词也搜得到。

---

## 8. 课程包（Course Pack）

> 插件代码里**不出现任何一门课的名字**。科目差异全部是数据。

### 8.1 位置与格式

```
vault/.meta/courses/<id>.yml
```

```yaml
id: autocontrol
name: 自动控制原理
aliases: [自控, 控制工程]
form: proof                 # 默认答案形态，题目可覆盖
figureTypes: [block, signal_flow, bode]
methods:                    # 该方法词表（L2）
  - { id: laplace, label: 拉氏变换 }
  - { id: transfer_func, label: 求传递函数 }
  - { id: block_reduce, label: 结构图等效化简 }
  - { id: mason, label: 梅森增益公式 }
style: guided               # 默认书写档位，可被库/题目覆盖
```

### 8.2 解析顺序

1. 题目 frontmatter 的 `course`；
2. 库 frontmatter 的 `course`；
3. `vault/.meta/courses/_default.yml`（通用包，`methods` 只含 `other`）。

### 8.3 自动建包

入库时若匹配不到课程包：AI 按题干推断，生成一个草稿包（`status: draft`），**不自动启用**，在导入校对页让用户确认或改名。

### 8.4 内置包

首批内置：`math`、`linalg`、`physics`、`chemistry`、`biology`、`english`、`chinese`、`cs`、`autocontrol`、`stem`（工科通用）、`_default`（兜底）。
生化、材料、语文等由 8.3 自动生成，不预置。

**位置规则**：插件自带包在 `<plugin>/courses/*.yml`，用户包在 `vault/.meta/courses/*.yml`；同 id 时用户包覆盖内置包。这样升级插件不会冲掉用户的修改。

---

## 9. 答案形态（Form）

同一套追问机制，四种正文结构。形态写在题目 frontmatter 的 `form`。

| 形态 | 正文分区 | 锚点粒度 | 典型科目 |
|---|---|---|---|
| `proof` | `## 步骤`（S1…Sn） | 步骤 / 关键式 | 数学、物理、自控 |
| `analysis` | `## 要点`（P1…Pn，每点含「依据：」） | 要点 | 生物、化学、材料、政治 |
| `essay` | `## 段落`（每段含「改写点：」） | 段落 / 句子 | 英语作文、翻译、语文 |
| `diagram` | `## 图` + `## 说明` | 图的节点 | E-R、结构图、流程 |

### 9.1 各形态的块语法

```markdown
## 要点
### P1 结论：细胞膜的流动镶嵌模型成立
- 依据：荧光漂白恢复实验
- 关键词：磷脂双分子层 / 蛋白质镶嵌

正文…
```

```markdown
## 段落
### 第 1 段 引入
- 改写点：把 there be 换成更具体的动词

正文…
```

````markdown
## 图
```figure
{ "type": "er", "nodes": [], "edges": [] }
```

## 说明
…
````

### 9.2 可选块（proof 变体）

数学/线代常见「先分析、再展示错解、最后正解」的笔记体，作为可选块保留：

```markdown
## 分析
见 A* 想公式 A* = |A|·A⁻¹

## 错解
…（写清错在哪一步、误用了哪条性质）

## 步骤
S1 …
```

`## 分析` 与 `## 错解` 都可缺省。错解块对「同错反复犯」的题价值最大。

### 9.3 各科作答骨架

每门课固定的书写骨架（先写什么、公式怎么放、单位带不带），见 [FORMATS.md](./FORMATS.md)。课程包用 `style: physics` 之类引用；无专用骨架时走 `_default`（通用四条）。

### 9.4 形态判定

入库时按题干特征猜一次（有作图要求→`diagram`；有「简述/说明/分析」→`analysis`；作文/翻译→`essay`；其余→`proof`），**在校对页可一键改**。

### 9.5 书写档位（Style）

同一道题，三种写法，默认 `guided`。

| 档 | 约束 | 用途 | 副作用 |
|---|---|---|---|
| `strict` | 只准用该科骨架（§9.3），段落数与顺序由骨架决定 | 考试作答、错题本、需要可复现 | 偏题会被削足适履 |
| `guided` | 骨架定**结构**，内容自由；允许多一段「题眼」 | 日常默认 | 偶尔啰嗦 |
| `free` | 模型自行组织，不套骨架 | 探索思路、创新题 | **锚点变粗**（见下） |

**覆盖顺序**（后者覆盖前者）：

```
全局默认 guided → 课程包 style → 库 frontmatter → 题目 frontmatter → 单次生成时下拉
```

**free 档的硬约束**：仍必须输出分块边界（哪句是结论、哪句是推导），只是不套骨架。
这样锚点从「精确到一步」降级为「精确到一段」——能用，但追问体验弱于 guided。

**A/B 对比**（同题同时出 strict 与 free 两版并排挑选）**不进第一版**：生成成本翻倍，放 P2；用户的选择可作为偏好信号回收。

**strict 的额外价值**：可复现。同一道题今天与三个月后生成的结构一致，错题本才立得住。

---

## 10. 图（Figure）

### 10.1 原则

1. **存源不存图**：库里只存生成图的源码，渲染结果随时可重建；
2. **画错比不画更糟**：每一级都要渲染校验，失败就降级，绝不显示破图；
3. **省 token 优先**：能用结构化数据就不写代码，能用代码就不写矢量路径。

### 10.2 渲染阶梯

| 级 | 载体 | 覆盖 | 约 token | 何时用 |
|---|---|---|---|---|
| **T1** | `figure` JSON（nodes/edges）+ 自绘 SVG | 框图、流程图、E-R、树、状态机 | ~60 | 默认，覆盖多数 |
| **T2** | Mermaid 源码（前端懒加载） | 时序图、类图、甘特、复杂流程 | ~150 | T1 表达不了、且是 mermaid 强项 |
| **T3** | Graphviz DOT（服务端布局） | 节点 > 12 的复杂有向图 | ~120 | 自动布局比手排好 |
| **T4** | Python 脚本（matplotlib / networkx / schemdraw）→ SVG | 函数图像、数值图、电路图 | ~300 | 坐标类、电路类 |
| **T5** | 兜底：显示源码 + 「此图需人工补」 | — | 0 | 前四级都失败 |

### 10.3 路由规则

模型在 `figure` 里自报 `type`，按表选择；未识别则走 T1 试一次。

| type | 走 |
|---|---|
| `block` / `flow` / `er` / `tree` / `state` | T1 |
| `sequence` / `class` / `gantt` / `journey` | T2 |
| 节点数 > 12 的有向图 | T3 |
| `plot` / `curve` / `circuit` / `chart` | T4 |
| 其他 | T1 → T2 → T3 → T5 |

### 10.4 校验与降级

- T1：渲染出的 SVG 元素数必须等于 `nodes + edges`，否则判失败；
- T2/T3：解析器抛错或输出空 SVG 判失败；
- T4：脚本 5s 超时、只允许白名单库、输出必须是合法 SVG；
- 任一级失败 → 自动降级下一级 → 最终 T5，并记录 `figure.error`；
- 所有降级都写进 `PROGRESS`/日志，便于事后看哪类图总失败。

### 10.5 图数据格式（T1）

```json
{
  "type": "block",
  "direction": "LR",
  "nodes": [
    { "id": "r", "label": "R(s)", "shape": "circle" },
    { "id": "g", "label": "G(s)", "shape": "box" }
  ],
  "edges": [
    { "from": "r", "to": "g", "label": "E(s)" }
  ]
}
```

`shape`: `box` | `circle` | `diamond` | `db` | `note`。节点可挂追问：渲染后点节点 → 追问抽屉，锚点写 `@F:<nodeId>`。

---

## 11. 录入（Ingest）

### 11.1 四类来源，一个入口

| 来源 | 处理 | 备注 |
|---|---|---|
| 图片（手机拍 / 截图） | 直接交视觉模型，**不用 OCR 引擎** | 一张约 1k token |
| 粘贴文本 | 直接结构化 | 最快 |
| Word (.docx) | python-docx 抽文本，公式转 LaTeX | 零视觉成本 |
| PDF | 先抽文字层；无文字层则逐页转图 | 扫描件走图片 |
| 文件夹 / 批量拖入 | 排队逐条处理 | 支持一叠照片 |

### 11.2 队列

```
vault/.meta/ingest/
├── queue.json        每条：id / source / status / 结果摘要
└── raw/              原始文件（图片、pdf），按 ingest id 命名
```

`status`: `pending` → `parsed` → `reviewing` → `committed` / `rejected`。

### 11.3 流水线

```
采集 → 识别（文本或视觉） → 结构化（题干/答案/科目/形态/图） → 校对（人工） → 入库
```

**校对页必须存在**：显示识别出的题干、答案首行、科目、形态、图，用户点「确认」才入库。理由：不校对就入库，脏数据会污染检索与记忆，比没有更糟。

### 11.4 与工具的关系

`study_ingest`（新增）负责 1→2→3；`study_add_question` 仍是最底层写入；有人工校对时走 `study_commit_ingest`。
