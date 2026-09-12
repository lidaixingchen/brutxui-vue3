# BrutxUI 完整指令参考手册

> 本指南是 BrutxUI 工程指令体系的常青参考手册。用于收纳低频、专项、发布、性能压测与底层契约检查指令。日常高频开发自检请以 [`AGENTS.md`](../../AGENTS.md) 为准。

---

## 一、 指令分层治理架构

为保持 Agent 与开发者的心智聚焦，工程指令遵循 **“高频聚焦主表，低频沉淀手册”** 的分层设计原则：

- **第一层：日常高频指令（收纳于 [`AGENTS.md`](../../AGENTS.md)）**
  - 单测：`pnpm --filter <pkg> test <path>`
  - 修复：在所属包运行 `pnpm exec eslint <file> --fix`
  - 类型：`pnpm --filter <pkg> typecheck`
  - 门禁：`pnpm check:contracts`（静态契约并发检查）、`pnpm check:docs`（文档健康度并发检查）
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
| `pnpm test:consumers` | 默认运行 U1/C1；`--all` 运行 U1/C1/C3；`--filter U1` 聚焦场景，未知值会失败 | 根目录 |

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

### 2. 生产消费者成本

先完成构建并打包候选 UI，使用固定的消费者依赖锁文件运行：

```bash
pnpm exec tsx packages/ui/perf/cost-runner.ts --artifact <UI-tarball> --output <结果目录> --assert-resources
```

结果包含 JS/CSS 的 raw、gzip、Brotli 字节，静态与动态依赖闭包，以及真实 Chromium 的生命周期资源和 p50/p95。`BRUTX_CHROMIUM_EXECUTABLE` 可指定浏览器路径。计时保留全部测量样本并作为报告项；字节预算由 `size` 校验，资源数量由 `--assert-resources` 校验。聚合样式成本单独统计。

U1/C1/C3 可通过 `--artifacts <候选目录或 manifest>` 复用经 SHA-256 校验的产物。消费者锁文件位于 `packages/cli/scripts/fixtures/consumers/`；成本锁文件位于 `packages/ui/perf/fixtures/`。更新消费者依赖时显式设置 `BRUTX_UPDATE_CONSUMER_LOCKS=1` 运行对应矩阵并审查锁文件，正常验收使用 frozen install。

### 3. 基准回归比对（`scripts/bench-diff.mjs`）

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

### 5. 公开契约与源码依赖
- **单独检查**：`pnpm --filter brutx-ui-vue check:exports`
- **规则说明**：校验 `api-contract.ts`、真实源码符号及全部公共入口投影的一致性。`pnpm check:api-dependencies` 检查模块归属、依赖方向、循环及运行时构建工具隔离。

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

## 七、 生成编排与候选快照

根目录和包级 `build/lint/typecheck` 通过统一 Turbo 图进入包级 `generate`。`build:artifact`、`lint:source`、`typecheck:source` 是底层消费任务；独立调用它们前须准备生成结果。联合验收使用 `pnpm exec turbo run build:artifact typecheck:source lint:source`，同一图中的 UI/CLI 生成各执行一次。

源码生成任务 `cache: false`，每次比较完整输出并保留混合文件手写区域。构建缓存只恢复 `dist`；Registry 构建同样保持 `cache: false`。

| 命令 | 职责 |
| --- | --- |
| `pnpm generate:tokens` | 统一运行 UI/CLI 生成入口 |
| `pnpm --filter brutx-ui-vue generate` | 生成 UI 清单、公开入口、exports 及令牌 |
| `pnpm --filter brutx-vue generate` | 生成 CLI 令牌与模板区域 |
| `pnpm check:generated` | 只读比较 UI/CLI 全部生成结果 |
| `pnpm check:staged-snapshot` | 从 Git index 物化候选快照并检查生成一致性 |
| `pnpm test:tooling` | 生成事务、锁、缓存输入、部分暂存与门禁等价回归 |

`pre-commit` 只校验已暂存快照，不运行工作区生成或自动暂存。失败时显式运行生成命令，审查差异并自行暂存需要提交的内容。候选源码依赖的手写文件也须进入暂存区。
