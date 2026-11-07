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
