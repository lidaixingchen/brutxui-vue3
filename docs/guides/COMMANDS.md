# Engineering Commands Reference Guide — BrutxUI

> 本指南是 BrutxUI 工程指令体系的常青参考手册。用于收纳低频、专项、发布、性能压测与底层契约检查指令。日常高频开发自检请以 [`AGENTS.md`](../../AGENTS.md) 为准。

---

## 一、 指令分层治理架构

为保持 Agent 与开发者的心智聚焦，工程指令遵循 **“高频聚焦主表，低频沉淀手册”** 的分层设计原则：

- **第一层：日常高频指令（收纳于 [`AGENTS.md`](../../AGENTS.md)）**
  - 单测：`pnpm --filter <pkg> test <path>`
  - 修复：`npx eslint <file> --fix`
  - 类型：`pnpm --filter <pkg> typecheck`
  - 门禁：`pnpm check:contracts`（静态契约并发 6 合 1）、`pnpm check:docs`（文档健康度并发 5 合 1）
  - 归档：`pnpm doc:archive`（方案完工一键物理迁移、状态固化与知识地图全景自愈）
  - 脚手架：`pnpm generate:*`
- **第二层：低频与专项运维指令（收纳于本文档）**
  - 版本发布与 Changeset 治理
  - 性能基准与 PR 比对
  - 产物深度排障与体积分析
  - 底层契约单项执行与基线维护

---

## 二、 版本发布流水线

本项目生产发布采用 **GitHub Actions 自动化流水线（Tag 驱动）**，禁止在本地开发机直接运行 `changeset publish`（本地缺少官方签名私钥，会绕过一致性门禁与资产同步）。

### 1. 标准发版时序

```text
[日常迭代]             [版本冻结]               [发布准备]             [远程发布]
pnpm changeset  ──>  pnpm version-packages  ──>  pnpm release:prepare ──>  git push --follow-tags
(声明变更意图)          (消耗变更/升级版本)        (更新根 CHANGELOG/Tag)     (CI 自动签名并发布 NPM)
```

### 2. 发布相关命令

| 指令 | 说明 | 执行位置 |
| --- | --- | --- |
| `pnpm changeset` | 交互式生成变更说明文档（放入 `.changeset/*.md`） | 根目录 |
| `pnpm version-packages` | 消耗 changeset，自动升级各子包 `package.json` 版本号 | 根目录 |
| `pnpm changelog` | 生成根 `CHANGELOG.md` 最新版本段 | 根目录 |
| `pnpm changelog:dry` | 预览即将生成的 changelog 内容，不写入文件 | 根目录 |
| `pnpm release:prepare` | 发布前版本校验与预备检查 | 根目录 |
| `pnpm release:check` | 本地发布门禁全量检查（构建/契约/消费者/发布状态机） | 根目录 |
| `pnpm release:tag` | 基于当前版本打本地 Git Tag（自动幂等校验） | 根目录 |
| `pnpm test:release` | 发布状态机协调器与 provenance 演练测试 | 根目录 |
| `pnpm test:consumers` | 运行真实消费者安装构建矩阵（U1/C1/C3 等） | 根目录 |

详细发布规范参见 [发布流程与 Changelog 指南](RELEASE.md)。

---

## 三、 性能基准与压测体系

针对运行时开销敏感的模块（如虚拟滚动、复杂选择器、CVA 变体组装），工程内置了基准测试与 PR 回归对比体系。

### 1. 基准测试执行

| 指令 | 说明 | 执行位置 |
| --- | --- | --- |
| `pnpm bench` | Turbo 并行运行所有子包基准测试（Node 环境） | 根目录 |
| `pnpm --filter brutx-ui-vue bench:json` | 导出 UI 组件基准测试结果为 JSON（用于基准对齐） | 根目录 |
| `pnpm --filter brutx-registry-vue bench` | 压测 Registry 生成引擎构建耗时 | 根目录 |

### 2. 基准回归比对（`scripts/bench-diff.mjs`）

在 CI 或本地对比两个版本的性能基准（通常为 main 分支 baseline 与 PR 分支）：

```bash
node scripts/bench-diff.mjs <main-bench.json> <pr-bench.json>
```

- **判定阈值**：
  - `|delta| < 5%`：视为正常噪声范围；
  - `delta < -5%`：疑似性能回归；若超过 2 项则需人工复核；
  - `delta > 5%`：判定为性能优化提升。

---

## 四、 包体积与产物深度诊断

针对构建产物（`dist/`）的体积膨胀与模块隔离性，提供专项分析工具（**执行前需确保已完成 `pnpm build`**）。

| 指令 | 说明 | 执行位置 |
| --- | --- | --- |
| `pnpm --filter brutx-ui-vue size` | 校验核心入口（ESM 全量、Button 摇树、CSS）体积是否超标 | 根目录 |
| `pnpm --filter brutx-ui-vue size:why` | 打开可视化打包分析器，定位体积超限的具体模块与依赖 | 根目录 |
| `pnpm --filter brutx-ui-vue check:isolation` | 检查产物依赖隔离性，防止未外部化的重型库被打包进 dist | 根目录 |
| `pnpm --filter brutx-ui-vue test:package` | 冒烟测试：模拟纯 ESM 消费端环境，测试 120+ 子路径解析 | 根目录 |

---

## 五、 门禁工具协议与底层逃生通道

### 0. 统一门禁的双模态协议（Agent Result Envelope）
门禁命令 `pnpm check:contracts` 与 `pnpm check:docs` 基于底层调度引擎（[`scripts/lib/guard-runner.mjs`](../../scripts/lib/guard-runner.mjs)）并发执行，默认采用 **Unix 沉默原则**（全绿仅极简单行输出）。针对 Agent 自动化自愈与机器调用，支持 `--json` 标志输出标准 **Result Envelope** 结构：
- **状态机**：严格限定为 `success`、`partial_success`、`error`；
- **控制与自愈（`control.suggested_actions`）**：在违规时精准返回修复命令（如 `fix_command`）与操作引导，无需解析自然语言；
- **副作用声明（`effect`）**：明确标识当前操作是否产生了文件修改（如 `--fix` 自愈链接）；
- **用法**：`pnpm check:contracts --json` 或 `pnpm check:docs --json`（详细日志加 `-v`，引擎单测运行 `node --test scripts/lib/guard-runner.test.mjs`）。

---

### 底层单项检查与基线维护逃生通道
当需要单独排查特定规则或更新快照基线时，可使用以下底层命令：

### 1. 幽灵依赖守卫（Phantom Dependencies）
- **单独检查**：`node scripts/scan-phantom-deps.mjs` 或 `pnpm check:deps`
- **规则说明**：基于 AST 静态扫描 Monorepo 6 个包的源码与脚本，严禁直接引用未在自身 `package.json` 中声明的依赖。

### 2. 设计令牌 Fallback 审计
- **单独检查**：`pnpm --filter brutx-ui-vue audit:fallback:check`
- **更新基线**：`pnpm --filter brutx-ui-vue audit:fallback:update`（将当前违规快照写入 `.fallback-baseline.json`，仅在确认合理时更新）
- **自动修复**：`pnpm --filter brutx-ui-vue audit:fallback:fix`（自动补全缺失的 fallback 值）

### 3. 已废弃工具类防回潮
- **单独检查**：`pnpm --filter brutx-ui-vue check:deprecated:check`
- **更新基线**：`pnpm --filter brutx-ui-vue check:deprecated:update`（更新 `.deprecated-baseline.json`）

### 4. Tailwind `@source` 类名字面量
- **单独检查**：`pnpm --filter brutx-ui-vue check:class-literals`
- **规则说明**：检查所有动态拼接产出的类名是否在源码中以完整字面量存在，防止 Tailwind v4 扫描器丢失样式。

### 5. 组件重导出与 Manifest
- **单独检查**：`pnpm --filter brutx-ui-vue check:exports`
- **规则说明**：校验 `src/index.ts` 导出与 `registry-manifest.json`、`exports-manifest.json` 的 100% 一致性。

### 6. CLI 令牌对齐
- **单独检查**：`pnpm --filter brutx-vue check:tokens`
- **规则说明**：校验 CLI `brutalist.css` 与 UI 侧的主题变量、阴影和实用类对齐。

---

## 六、 API 文档生成工具

| 指令 | 说明 | 执行位置 |
| --- | --- | --- |
| `pnpm --filter brutx-ui-vue docs:api` | 基于 TypeDoc 提取组件与 Composable 类型定义 | 根目录 |
| `pnpm --filter brutx-ui-vue docs:api:full` | 全量生成组件 API 规格与 Props/Emits/Slots 文档 | 根目录 |
| `pnpm --filter brutx-ui-vue docs:api:vue` | 仅提取 Vue SFC 声明文档（跳过 TypeDoc） | 根目录 |
