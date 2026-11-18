# PROGRESS · dsh-studygo

## 轮次 1（2026-11-06 23:40 – 23:58）· G0 技术验证

### 已完成

- 插件包 `dsh-studygo` 建好：`package.json`（dsh.bundle.patch + dsh.client）、`cordis.patch.yml`、`lib/index.js`（宿主）、`lib/client.js`（浏览器）、`scripts/shot.mjs`、`scripts/smoke.mjs`
- 侧边栏「题库」入口 + 主区面板：**已在用户的真实 DSH 里出现**（HMR 热挂载，未重启）
- 宿主工具 `study_create_library`：**已在真实会话里调用成功**，写入 `E:\DSH题库插件\vault\数学-导数\index.md`
- 截图链路：两条都跑通 —— ① Edge headless + CDP（可点击、可截图）② PowerShell PrintWindow（截真实桌面窗口，含中文路径转码坑）

### 已验证（可执行证据）

| 验收项 | 结果 | 证据 |
|---|---|---|
| 构建/加载 | ✅ | 无构建步骤（手写 ESM + 预编译 client bundle），host 直接加载 |
| 侧边栏入口 | ✅ | `artifacts/G0-desktop-live.png`（真实窗口） |
| 面板渲染 | ✅ | `artifacts/G0-panel.png`、`G0-desktop-stack.png` |
| 工具注册 | ✅ | 工具列表出现 `study_create_library`；smoke 脚本验证参数/输出结构 |
| 落盘 | ✅ | `vault/数学-导数/index.md`，frontmatter 合法 |
| 幂等 | ✅ | 二次调用返回「已存在（已刷新）」，不重复建文件 |
| 自动截图 | ✅ | `scripts/shot.mjs <url> <out.png> [w] [h] [点击文本,...]` |

### 关键技术发现

1. **挂载通道是 `dsh.profile.bundles`，不是 cordis.patch.yml 手写条目**。手写 `- id/name` 在 desktop profile 里不生效；追加到 `package.json` 的 bundles 数组才被 loader 识别。
2. **HMR 能热挂宿主与客户端**，无需重启（这次就是热的）。前提是 package 已在 profile 的 node_modules 里（用 junction 链接即可，不必 pnpm install）。
3. **零依赖可行**：宿主只用 node 内置模块，client 手写 `window.__ModuleLoader__.load` 格式，不需要 tsdown/TS/任何 npm 包 —— 省掉了整条构建链和网络风险。
4. **可以开独立测试 host**：`ELECTRON_RUN_AS_NODE=1 "DeepSeek Harness.exe" <asar>/.../dsh/lib/bin.js --profile studygo --port 6311 --no-open`，拿到了带 token 的 URL，可以反复重启验证而不碰用户主实例。这是后续夜间自测的主力手段。
5. **截图两条路**：CDP 走 URL（需 token，headless 稳定）；PrintWindow 走窗口（不怕认证，但中文路径必须避开 PowerShell 的 ANSI 编码）。
6. **测试 host 与主实例共享 `~/.dsh` 会打架**：两个 host 同时跑时，`dsh-wechat-plugin` 会争抢 `~/.dsh/wechat/state.json`（EPERM rename）。已确认文件未损坏。以后起测试 host 要么给独立的 DSH_HOME，要么用 `--patch` 把 wechat 插件关掉。

### 未验证 / 遗留

> 2026-11-07 00:21 用户已在自己的主应用里点开「题库」并确认面板正常 —— G0 全部验收项由用户侧闭环。


- 真实窗口里「点进面板」没做（用 UI 自动化点桌面窗口风险高，改由测试 host 的 CDP 点击验证，代码一致）
- 面板目前是纯空页，没有任何业务逻辑（符合 G0 范围）
- 未在 desktop 上做一次冷启动验证（担心重启打断会话；热挂载已通过）

### 下一步（G1 起点）

1. 数据模型落地：`Question`/`Step`/`Thread`/`Concept` 的 Markdown schema + SQLite FTS（用 node:sqlite，零依赖）
2. 工具集：`question_add`、`question_followup`、`knowledge_search`
3. 面板从空页升级成「库列表 → 题目列表 → 题目详情」三栏骨架

### 复现命令

```bash
# 起一个隔离测试 host
ELECTRON_RUN_AS_NODE=1 "C:/Users/ASUS/AppData/Local/Programs/DeepSeek Harness/DeepSeek Harness.exe" \
  "C:/Users/ASUS/AppData/Local/Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js" \
  --profile studygo --port 6311 --no-open

# 截图（可带点击文本）
node E:/DSH题库插件/plugin/scripts/shot.mjs 'http://127.0.0.1:6311/?token=<token>' out.png 1440 900 '继续,题库'
```

### 夜间红线遵守情况

- 未发布、未删除用户数据、未装依赖 ✅
- 所有改动可回滚（插件在 E:\DSH题库插件\plugin，profile 只加了 1 个 bundle 名 + 1 个 junction）✅

## 轮次 2（2026-11-07 00:30 – 01:20）· G1 地基

### 已完成

- `SPEC.md`：目录结构、库/题目 frontmatter、步骤块与追问块语法、索引 schema、迁移规则
- `lib/store.js`：vault 读写（建库、id 分配、渲染、解析、列表、幂等）
- `lib/index-db.js`：`node:sqlite` + FTS5；中文用二元组（bigram）入索引，解决 unicode61 不切中文的问题
- `lib/host.js`：三个工具 + `/study/api` 只读路由（libraries / questions / question / search）
- `lib/client.js`：三栏面板（库列表 → 题目流 → 题目详情 + 步骤 + 相关题 + 搜索）
- `scripts/seed.mjs` / `eval.mjs` / `smoke-g1.mjs`：造数、检索评测、工具冒烟

### 已验证

| 验收项 | 结果 |
|---|---|
| 检索命中率 | **14/14 = 100%**（100 题，14 条真实查询） |
| 工具注册 | `study_add_question` / `study_followup` / `study_search` 全部可调用 |
| 写盘 | `数学-导数/q-20261107-0001.md`，frontmatter 与步骤块格式正确 |
| 追问追加 | 追加到「## 追问」段，`- @S1 …` + 缩进回答，原有内容零改动 |
| 面板三栏 | 库 2 个（示例-100题 100 / 数学-导数 1）、题目流、详情含 S1–S4、chip、相关题 |

### 关键发现

1. **`ctx.inject` 的写法**：`inject = ['tools']` 是必选；可选服务要用 `ctx.inject(['webServer'], cb)` 等它就绪，直接 `ctx.get('webServer')` 在 apply 阶段会是 undefined。
2. **client 里 CSS 对象的键名会被覆盖**（`body` 用了两次导致 flex 容器失效）——写样式表要防重名。
3. 中文检索必须自己做 bigram，否则 FTS5 只能匹配 3 字以上的查询（「最值」「导数」都会 0 命中）。

### 遗留

- 面板还没有「新建库 / 新建题目」入口（G2 随答题闭环一起做）
- 示例库 `示例-100题` 是测试数据，正式用之前删掉：`rm -rf E:\DSH题库插件\vault\示例-100题` 并删 `.index\study.db`
## 收尾核对（2026-11-07 01:35）

- 用最终提交的代码重跑了一遍隔离 host：三栏正常、相关题已去重、101 题、命中率 14/14（100%）。
- **桌面端现状**：宿主仍是昨晚加载的旧版本（工具列表里只有 `study_create_library`）。新工具与新 API 需要**重启一次 DSH** 才会注册；客户端 `client.js` 是按请求从磁盘读的，所以 Ctrl+R 就能看到新界面（但 API 会提示未就绪）。
- 结论：G1 的代码与验收在隔离 host 上全部通过；桌面端只差一次重启。

## 轮次 3（2026-11-07 12:40 – 14:0x）· G2 答题闭环

### 已完成

- **布局改造**：左 56px 图标条（库/新建/刷新，库列表覆盖式浮层）、三层题卡（卷面/讲解/一句话）、右辅助栏（相关题）、底部追问抽屉占位
- **生成管线**：`study_solve` / `POST /study/api/solve` → 课程包 + 骨架 + 档位 → 结构化卡片；`/commit` 落盘
- **课程包**：11 个内置（math/linalg/physics/chemistry/biology/english/chinese/cs/autocontrol/stem/_default），YAML 自解析，用户包覆盖内置
- **验证**：真实题生成成功——“闭区间三次函数最值”4 步，卷面/讲解/关键式/gist 齐全，数学正确
- **验算**：sympy 通道打通（系统 Python 3.12 + sympy 1.14），等式链逐段比较；故意错的等式能判 fail
- **图**：T1 JSON→SVG 渲染器（框/圆/菱形、正反向边、反馈弧）；结构图测试通过
- **存储**：frontmatter 增加 gist/form/style/course/verify；正文支持 `## 要点`、`- 讲解：`、```figure 块

### 关键坑

1. **`ctx.llm` 必须 inject**：`export const inject = ['tools', 'llm']`，否则 “cannot get property llm without inject”。
2. **推理型模型吃 token**：deepseek-flash 一次作答先跑 ~1.2 万 reasoning token，maxTokens 2400/6000 都只拿到推理、没有正文。改成 12000，并在 `finish.reason === 'max-tokens'` 时自动翻倍重试一次（上限 32000）才成功。**单题成本 ≈ 1.2–2.4 万 token**，G3 要想办法降（换低推理档或缩小 prompt）。
3. **chunk 形状**：`block-start{blockType}` → `reasoning-delta{text}` / `text-delta{text}` → `usage` → `finish{reason:{kind}}`。只认 text-delta。
4. PowerShell 发 JSON 会把中文写成乱码（生成 `-----` 目录），改用 Node fetch 才正确 —— 测试脚本已改。

### 未完成 / 已知缺口

- **公式渲染**：没有 KaTeX，只有极简 LaTeX 去符号（`(a)/(b)` 形式），可读但不美观 → G3
- **图片录入**：未做（只支持粘贴文本）→ G5
- **追问抽屉**：只占位，不能对话 → G3
- **essay 形态**：未做 → G5

### 验收对照

| 项 | 结果 |
|---|---|
| 布局（图标条/三层/抽屉） | ✅ |
| 生成管线 | ✅ 真实题通过 |
| sympy 验算 | ✅ 正确通过、错误判 fail |
| T1 图渲染 | ✅ 结构图 |
| 课程包 | ✅ 11 个 |
| 录入 | ⚠️ 仅文本 |
| 单题成本 | ⚠️ 偏高（1.2–2.4 万 token） |

### 图片录入：实测结论（阻塞）

在宿主里直接调 `ctx.llm.stream` 发图片，**四种 block 形状全部失败**：

```
a { type:'image', source:{ type:'base64', mediaType, data } }
b { type:'image', source:{ type:'base64', media_type, data } }
c { type:'image', mimeType, data }
d { type:'image', url:'data:...;base64,...' }
```

四次都是 `finish{reason:{kind:'error', failure:{message:'DeepSeek Messages transport failed', code:'TRANSPORT'}}}`，
用 240×90 的小图也一样，排除尺寸问题。结论：**该 provider 路由不支持插件侧直传图片**。

已落地：`POST /study/api/upload` 保存图片到 `vault/附件/<日期>/`，面板「新建」里有「上传图片」按钮，
但会明确提示「视觉通道不可用，请粘题干文字」——不假装能识别。

待选方案：① 走 agent 侧 OCR（把图给会话里的模型）；② 等 provider 支持 image 模态；③ 本地 OCR（PaddleOCR/RapidOCR，重）。

### 图片录入：已解决（Windows 内置 OCR）

试过的路线：

1. 插件直传图片给模型 → 四种 block 形状全部 `TRANSPORT` 失败（见上）；
2. **Windows.Media.Ocr（系统自带，无需安装）→ 成功**。

实现：

- `scripts/ocr.ps1`：PowerShell + WinRT（`BitmapDecoder` + `OcrEngine`），语言 `zh-Hans-CN`；
- 读图走 `InMemoryRandomAccessStream`（避开 StorageFile 的坑）；
- **结果写 UTF-8 文件再由 Node 读**——直接读管道会被 OEM 代码页 936 打成乱码（这个坑踩过一次）；
- 路径用 base64 传参，避开中文路径在命令行里的编码问题；
- `POST /study/api/upload` 落盘 → `POST /study/api/ocr` 识别 → 面板自动填进输入框，用户校对后再生成。

实测：一张手机截图识别出 223 字，中文可读；界面元素（按钮、广告）也会被识别进来，需人工删。

### 截图

- `artifacts/G2-final.png` 三层题卡 + 图
- `artifacts/G2-figure2.png` 结构图渲染
- `artifacts/G2-new.png` 新建弹窗（含上传图片）
- `artifacts/ocr-sample.txt` OCR 原始输出

## 轮次 4（2026-11-07 23:00）· 用户反馈后的 UI 修正

- **追问键**：每个步骤标题旁加「追问」按钮（原来只有 S 编号能点，不可发现）；抽屉里可直接提问，答案调模型生成后写进题目 md 并刷新。实测一问一答 150 字，正确。
- **自动判断**：新建弹窗默认勾选「自动判断科目与题型」，用关键词表（零成本）判断课程与形态；取消勾选才显示三个下拉。
- **弹窗放大**：720 → 920，输入框 96 → 170 高。
- **同库切题**：题卡右上加 ‹ › 上下题；左栏浮层里新增「本库题目」列表，点任意一条直接切换。

## 轮次 5（2026-11-08）· G3 第一部分：KaTeX + 追问树

### KaTeX（本地、离线）

- 下载 katex 0.16.11（js 275KB + css 23KB + 47 个字体，约 560KB）到 vendor/katex/
- 宿主新增独立静态路由 /study/static/*。注意：不能塞进 /study/api 的 prefix handler，那条路由会先剥前缀，永远匹配不到 /study/static
- 客户端 MathText 组件：按行内 / 行间公式切分，katex.renderToString 渲染，失败退回等宽文本
- 坑：用 String.replace(字符串, 含双美元的内容) 插入代码时，双美元会被替换引擎折叠成单美元，导致行间公式判定失效、整段变红。改用 edit 直改才修好

### 追问树

- 存储格式：缩进列表，- @S2 问题 / - 答：… / - 问：追问 / 更深一层 - 答：…
- parseThreads 解析成树（兼容旧格式 无前缀的回答行）
- /followup 支持 parent 参数：找到父节点行，插到其子树末尾
- 抽屉按锚点渲染整棵树（递归组件）；右下角新增「追问树」浮层，列出有追问的步骤与子问题，点条目跳到对应步骤并打开抽屉

### 实测

- 行内/行间公式均正常渲染（G3-katex3.png）
- 追问树：S2 下挂一条追问，再对其追问一次，树结构与答案都正确落盘（smoke-tree.mjs）

### 未完成

- 成本压缩还没做：单题仍 1.2–2.4 万 token（推理占大头），下一轮专门做

## 轮次 6（2026-11-08）· G3 第二部分：成本压缩 + 自动判科修正

### 成本

- 发现 `ctx.llm.stream` 支持 `reasoningEffort`：传 none 会空返回，传 low 正常。
- 默认给 `study_solve` / `followup` 传 `effort: 'low'`。
- 实测同一道题：默认档 22.5s、low 档 10.6s；reasoning-delta 从约 1.2 万条降到约 3.4 千条（约 1/3）。
- 仍需注意：不同题波动大（10–25s），并且推理 token 仍是大头，后续可考虑进一步缩短 prompt。

### 自动判科修正

- 关键词表补了「最大值/最小值/极大/极小/单调/连续」；实测：
  - 求最值 → math；求矩阵的秩 → linalg；传递函数 → autocontrol；细胞膜 → biology + analysis
- 仍判不出的（如「电网络」）回退 _default，可手动选。

## 轮次 7（2026-11-08）· G3 修订：追问改为行内 + 树面板可拖动

- 追问从底部抽屉改成**行内**：每个步骤正文下直接显示 Q/A 线程（可多层），末尾带输入框，回车或点发送即问；底部抽屉停用。
- 追问树面板改成**可拖动的节点连线图**（SVG，父节点在左、子节点在右、贝塞尔连线），默认停在右下角，按住标题栏可移开，点节点跳到对应步骤。
- 已知问题：模型有时用 \(...\) / \[...\] 写公式，当前只识别 $...$ / $$...$$，这类公式会显示成原文（试过自动转换，但正则把内容吃掉了，已回退，留给下轮）。

## 轮次 8（2026-11-08）· 追问交互定稿

按用户要求重做：

- 去掉每个步骤下面的常驻输入框；步骤改为「点此追问」/ 点编号选中，选中后底部出现唯一输入框（sticky，显示「对 S2 提问」）
- 回答**不在步骤下展开**，而是统一列在题目末尾的「追问 · N 处」区：每条以锚点 chip 开头（S2 / S1），下面接答案
- 区分两类：直接对题目某一步的追问 → chip 显示锚点名；对追问的追问 → chip 显示「追问」，并缩进一级 + 左侧竖线
- 任何节点右侧有「回复」，点它底部输入框变成「回复：…」，发送后挂在该节点下
- 树面板加宽节点（122px）、截断到 7–9 字，避免文字溢出框外

仍未解决：模型用 \(...\) 写的公式会显示原文（上一轮回退的方案），下轮用逐段扫描替换。

## 轮次 9（2026-11-08）· 修追问树点击跳转

- 根因：子节点没有 anchor（解析出来是空串），点击时直接 return，看起来就是「点了没反应」。
- 修法：遍历时把根节点的 anchor 传给所有子孙。
- 跳转做了两段高亮：滚到步骤 + 背景闪黄（实测 250ms 时 background = rgb(255,241,184)，rect.top 落在视口内）。
- 面板宽度上限 420 → 560，标题改成「拖动 / 点击节点跳转」。

## 轮次 10（2026-11-08）· 树节点跳转到「追问答案」本身

- 之前点树节点是滚到「步骤」，现在改成滚到对应的**追问条目**（thread-<anchor>-<n>），并给该条淡黄闪烁（#fffbeb，比之前的 #fff1b8 淡很多）。
- 树节点遍历时带 path（S2-0、S2-0-1…），与题末线程列表的 id 一一对应。
- 实测：点击 S2 节点后 `thread-S2-0` 背景为 rgb(255,251,235)，且滚动位置从 0 → 422。

## 轮次 11（2026-11-08）· G4 第一部分：相关题与对比

- 关系引擎 `lib/relations.js`：同套路（骨架 LCS ≥0.7）、同考点（topic 交集）、形似神不似（topic 有交集但骨架 <0.4，权重最高）
- 接口：`GET /study/api/related`、`POST /study/api/feedback`（deny 落 `vault/.meta/links.json`）、`POST /study/api/compare`（两题对比分析）
- 右侧栏改成相关题列表：类别 chip + 理由 + 对比 / 👍 / ✕（✕ 永久屏蔽）
- 对比弹窗：左右两列按步骤并列，底部可提问，答案用 KaTeX 渲染
- 生成时注入：同库检索命中的前 3 题作为「同库参考题」写进 prompt（尚未在生成结果里强制引用，下轮加强）
- 修了两个隐蔽 bug：`parseQuestion` 没解析 frontmatter 的 method（导致关系全空）；路由里 `links` 变量作用域错误（500）

### 还没做

- 知识卡（每库一份、可编辑、≤30 张）
- 讲解里强制引用相关题的那一句（现在只是把参考题喂给模型）

## 轮次 12（2026-11-08）· G4 收尾：知识卡 + 强制引用

- 知识卡：`## 知识卡` 段解析/写入（按行定界替换，不再用正则整段替换）；`POST /knowledge/draft` 让模型按知识点一次性生成「定义/方法/易错」三行卡；实测 6 张，内容具体可用。
- 右侧栏新增知识卡区，显示卡片与一键生成草稿。
- 生成引用：`study_solve` 把同库前 3 题作为参考题写进 prompt，并要求在对应步骤 explain 末尾写「（与 q-xxx 同套路）」。实测新题 3/3 步都带引用。
- 反馈验证：POST /feedback deny 后，/related 立即不再返回该题。

### 三次踩同一个坑

`String.prototype.replace` 的替换串里 `$&`、`$'`、`$$` 都是特殊模式，我三次用它插入代码，分别把代码、正则、整段函数写坏。以后一律用 indexOf + slice 拼接。

## 轮次 13（2026-11-08）· 修「公式没渲染」

根因：模型把公式写成了**没有 $ 包裹的裸 LaTeX**（`x=\pm\sqrt2`），而渲染器只认 $...$，所以整行当普通文字显示。

三处修：

1. 客户端换成**逐字符切分器**，同时认 `$...$`、`$$...$$`、`\(...\)`、`\[...\]`，不再用正则替换（上次就是替换把内容吃掉的）；
2. 兜底：一段文字里若没有 $ 但含 `\pm`/`^`/`_` 等 LaTeX 特征，整段按公式渲染；
3. 生成侧：prompt 明确「严禁裸 LaTeX」，并在解析后校验——含 LaTeX 却没 $ 的段落超过 40% 就自动重写一次。

实测：新生成的题 3/3 步都带 $，行内/独立公式渲染正常（G4-math.png）。

## 轮次 14（2026-11-08）· 新建改成整页 + 自动归库

- 弹窗删除，点「＋」或「＋ 新建」进入**主区整页**（大输入框、图片上传、库选择、生成后原地出预览再确认入库）。
- 去掉「自动判断科目与题型」勾选，改成永远后台判断；生成结果上显示判定结果（course · form）。
- 库下拉旁加「＋ 库」，弹输入框建库并立即选中。
- 新增「自动归库」（默认勾选）：`POST /suggest-library` 先按 FTS 找相似题，再对比**库的主导课程**（取该库题目的 course 众数），科目不同就不建议该库，改为建议新建以课程名命名的库。
- 实测：微积分题 → 数学-导数；传递函数题 → 新库「自动控制原理」。

## 轮次 15（2026-11-11）· 自动归库：无合适库时自动建库

- 规则：先找相似题且科目一致的库；再找同名/同前缀（课程名）的库；都没有才建议新建。
- 新建时**名字可改**（生成前出现「新库名」输入框），只在点「确认入库」时才真正建库——取消不会留下空库。
- 实测：微积分题 → 数学-导数（复用）；传递函数题 → 新库「自动控制原理」，入库后 `自动控制原理(1)` 出现在库列表。

## 轮次 16（2026-11-11）· G5-A 批量导入

- 新增 `/ingest/batch`：一次多张图 → 落盘 → Windows OCR → 返回文字（实测 2 张图 1 秒）。
- 新增 `/ingest/docx`：**纯 JS 解 zip 抽 word/document.xml**（Node zlib inflateRaw），不依赖 python-docx；实测 56 字正常。
- 新增 `/library/merge`：把 A 库题目迁到 B 库、改 frontmatter 的 library、重建索引；实测 1 题迁移后 A 库消失。
- 新建页加「批量导入图片（可多选）」「导入 Word」，队列里逐条：文本可改 → 生成 → 入库。

### 工具侧教训（重要）

- `tools.write` 在约 50KB 处会**截断**内容，写大文件必须用 run_code 里的 node fs 直接写。
- 用 `git checkout` 回滚后，某些未提交的状态声明会丢（`isNewLib`、`katexTick`），表现为「渲染直接白屏 + ReferenceError」。以后回滚后必须跑一遍页面冒烟。

### 未做

- PDF 导入（没有可用的纯 JS 文本抽取，暂建议截图代替）
- 合并库的 UI（接口已有，界面未接）
- 建库时的相似名提示
## 轮次 17（2026-11-11）· G5-A 收尾：库名查重 + 合并 UI

- `/library/create` 增加相似度检查（包含关系 0.9 / 编辑距离 ≥0.6）：返回 `needsConfirm` + 相似库列表，前端弹确认「用已有库还是坚持新建」。实测「数学」→ 提示「数学-导数」。
- 库浮层底部加「库管理 · 合并」：源库 → 目标库 → 合并（二次确认，源库删除、`lib` 指向目标库、列表刷新）。
- 批量导入旁加提示「PDF 请先截图或导出为图片」。
- 修了 `setKatexTick is not defined`（又一次：回滚丢了状态声明）。修后用 CDP 探针确认新建页**零 console 错误**。

### 目前 G5-A 完成度

| 项 | 状态 |
| 批量图片 | ✅ 多选→OCR→逐条校对→生成→入库 |
| Word | ✅ 纯 JS 解 zip |
| 库合并 | ✅ 接口 + 界面 |
| 库名查重 | ✅ |
| PDF | 说明：先转图片 |
## 轮次 18（2026-11-11）· 一页多题 / 跨页续题 / 批次上限

- `POST /ingest/split`：把一页 OCR 文本按「1.」「2、」「（3）」「第4题」「例5」切成多题；单行 OCR 先用「。；」+ 题号断开。实测 3 题正确切分。
- 批量导入时每张图先切题再入队：一页 3 题 → 队列 3 条，标题带「第N题」。
- 每条加「↑并入上一条」，处理跨页/跨栏的同一道题。
- 「本批统一库」下拉：默认按各题自动归库，可整批指定一个库。
- 一次最多 20 张（`MAX_IMAGES`），超出截断并提示。
## 轮次 19（2026-11-18）· 发布前收尾（1–3 步）+ 队列持久化

**发布阻塞项已修：**

- `package.json` 的 `files` 补上 `courses/`、`vendor/`、`scripts/ocr.ps1`（此前 npm 打包后运行时读不到课程包和 KaTeX）。
- 默认 vault 从写死的 `E:\DSH题库插件\vault` 改为 `~/.dsh/study-vault`，并支持 `config.vault` 与 `DSH_STUDY_VAULT`。
- 旧数据已复制到新默认路径（原目录保留作备份），实测三个库 9 道题都在。
- 补 `LICENSE`(MIT)、`engines`、`keywords`、`license`，版本 0.0.1 → 0.1.0。
- README 重写（原版还是 G0 验证版），加 `docs/` 三张截图。
- 清理 46 个调试脚本，只留 `shot.mjs` / `verify.py` / `ocr.ps1`。

**顺带完成：**

- 批量导入队列持久化：`.meta/queue.json`，刷新后自动恢复（实测播种一行 → 刷新 → 仍在，无 console 错误）。

**校验方式：** 模拟 npm pack 打包清单（91 个文件 / 1.48MB，无缺失）；启动宿主后 `/libraries` 返回三个库。
## 轮次 20（2026-11-18）· G5-B

### essay 形态（作文/翻译）

- 新增 essay 分支：模型输出 `paragraphs[]`（title / rewrite / why / body），落盘为 `## 段落` 段，标签 P1..Pn。
- 修了两个真 bug：
  1. `detectForm` 默认返回 `proof`，把课程包自带的 `form: essay` 覆盖掉了 → 英语题被当成证明题，0 个段落；改成「检测结果不是 proof 才用检测值」。
  2. `renderQuestion` 只认 `analysis` 才写 `要点`，essay 的段落整段丢失 → 写入后重读为空。
- 实测：英语作文生成 3–4 段、提交后重读段落数与生成一致（3/3）。

### 图 T1–T3

- 分层布局（按入度 BFS 求深度、同层居中），代替原来「所有节点排一行」的写法，长标签不再重叠。
- 新增 `table`（表格）与 `plot`（函数图像，模型自采样点，前端画折线 + 坐标轴）两种图。
- prompt 里写明三种图的数据格式。实测三种图同屏渲染正常（G5-figs.png）。

### 千题性能

- `/questions` 支持 `limit/offset`，前端首次 80 条 + 「加载更多（还有 N 题）」。
- 新增「导出整库 Markdown」（`/export`），8 题导出 7573 字符。

### 切题

- 规则切题补了「第二道/第二题/下一题」这类连接词，并修了「正文开头不是题号时永远不切」的判断 bug。
- 规则切不开且文本超 260 字时，自动用模型切一次（失败回落到原文本）。
- 回归测试：编号 3 题 / 单行 3 题 / 单题 / 连接词 2 题，四种都正确。
## 轮次 21（2026-11-18）· 图片粘贴

- 之前只支持「选文件」，不支持 Ctrl+V。现在在新建页挂 window 的 paste 监听：从 `clipboardData.items` 取 image/* → `getAsFile()` → 走批量队列（OCR → 校对 → 生成 → 入库）。
- 一次粘贴多张也会全部进队列；粘贴的图和选文件走同一条链路。
- 实测：用 CDP 构造 canvas 截图 → 派发 ClipboardEvent → 队列出现 `#1 paste-test.png`，无 console 错误。
- 按钮旁提示改为「也支持 Ctrl+V 直接粘贴截图 · PDF 请先转成图片」。
