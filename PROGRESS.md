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

### 未验证 / 遗留

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
