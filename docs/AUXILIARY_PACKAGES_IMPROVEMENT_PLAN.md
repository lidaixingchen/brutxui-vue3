# 辅助包改进方案

本文面向 `packages/cli`、`packages/registry`、`packages/shared` 三个辅助包，目标是在不改变 UI 包组件行为的前提下，提高组件分发链路的可靠性、可维护性和发布可控性。

## 范围与定位

| 包 | 当前职责 | 改进重点 |
| --- | --- | --- |
| `brutx-vue` (`packages/cli`) | 初始化项目、安装/更新/删除组件、诊断项目状态 | 用户路径稳定、错误恢复、离线/缓存体验、测试覆盖 |
| `brutx-registry-vue` (`packages/registry`) | 从 UI 源码生成 registry JSON 并校验一致性 | 构建确定性、schema 收敛、依赖分析准确性、发布门禁 |
| `brutx-shared-vue` (`packages/shared`) | 维护组件元数据和共享类型 | 元数据单一事实源、类型约束、与 registry 映射同步 |

三者的核心关系是：`shared` 提供组件事实，`registry` 将事实和源码编译为可分发 JSON，`cli` 消费 JSON 并写入用户项目。后续改进应优先保护这条链路。

## 总体原则

- **单一事实源**：组件名称、描述、npm 依赖、registry 依赖、文件映射应尽量从结构化元数据推导，减少多处手工维护。
- **生成物可复现**：registry build 在相同输入下输出完全一致；缓存只优化速度，不改变结果。
- **用户项目优先安全**：CLI 写文件前后都要验证路径，失败时尽量回滚或给出清晰修复路径。
- **门禁轻重分层**：日常开发跑最小测试；发布前跑完整 build、validate、集成测试和包内容审计。
- **错误可诊断**：网络、缓存、配置、路径、安全校验失败应有不同错误类型和可执行提示。

## 近期改进（P0）

### 1. 抽出共享 registry schema 与校验器

**问题**

当前 CLI 和 registry 各自维护 registry item 的运行时校验逻辑，字段如 `integrity`、`files.type`、`tailwind`、`cssVars` 在类型上没有完全统一。以后新增字段时，容易出现生成端、校验端、消费端理解不一致。

**方案**

- 在 `packages/shared/src/` 增加 registry schema 类型：
  - `RegistryFile`
  - `RegistryItem`
  - `RegistryIndexItem`
  - `RegistryIndex`
- 提供轻量运行时校验函数，例如 `validateRegistryItem(data, context)`。
- `packages/registry/scripts/build-registry.ts`、`packages/registry/scripts/validate-registry.ts` 和 `packages/cli/src/lib/registry.ts` 复用同一套类型与校验。
- 生成端输出对象使用 `satisfies RegistryItem` / `satisfies RegistryIndex` 约束，避免 build 脚本继续维护一套隐式 schema。
- CLI 当前通过 `tsup.noExternal` 打包 `brutx-shared-vue`，落地时需保留该打包策略；如果未来不打包 shared，则必须把 shared 改为 CLI 运行时依赖。

**验收**

- CLI 和 registry 不再各自复制 registry item 字段校验。
- 新增字段时 TypeScript 能提示生成端和消费端同步更新。
- `build-registry.ts` 中不再存在本地复制的 `RegistryIndexFile`、`RegistryIndexItem`、`RegistryIndex` 类型定义。
- `pnpm --filter brutx-vue test tests/registry.test.ts` 覆盖合法、非法、integrity mismatch 三类输入。
- integrity 校验策略明确覆盖远程 registry 与本地 registry；若保留差异行为，需要在测试名和文档中说明原因。

### 2. 建立 registry 构建快照测试

**问题**

registry build 是分发链路核心，但目前主要依赖 `validate` 检查结构，不足以捕捉“输出虽然合法但依赖顺序、路径重写、缓存命中行为变了”的回归。

**方案**

- 为构建脚本拆出纯函数模块：
  - `rewriteImports`
  - `extractDeps`
  - `extractRegistryDeps`
  - `computeIntegrity`
  - `buildRegistryItem`
- 为 `packages/registry` 增加最小测试基础设施：
  - `vitest` devDependency
  - `test` script，例如 `vitest run`
  - `tests/` 目录，仅覆盖 registry 构建核心函数
- 给这些函数补单元测试。
- 选取 3 个代表组件做小快照：
  - 简单组件：`button`
  - 多依赖组件：`data-table`
  - 页面/区块组件：`settings-page`

**验收**

- registry 构建核心逻辑可以脱离全量 build 单独测试。
- 快照变化能明确显示文件列表、依赖、integrity 或 import 重写差异。
- 日常验证可运行 `pnpm --filter brutx-registry-vue test build-registry.test.ts`，不需要触发全量 registry build。
- 发布前仍以 `pnpm --filter brutx-registry-vue build && pnpm --filter brutx-registry-vue validate` 作为最终门禁。

### 3. 增强 CLI 写入事务模型

**问题**

`add` 已有基本回滚，但 `init`、`doctor --fix`、`remove` 仍有多步写入场景。任一步失败，都可能留下半配置状态。

**方案**

- 在 CLI 内部引入小型 `FileTransaction` 工具：
  - 写入前记录原始内容或不存在状态。
  - 成功后 `commit()`。
  - 出错时 `rollback()`。
- 优先接入：
  - `init` 写 `components.json`、utils、CSS tokens。
  - `doctor --fix` 写配置、CSS、utils。
  - `remove` 删除组件目录和孤儿文件。

**验收**

- 新增测试模拟中途写入失败，断言原文件恢复。
- 回滚失败时输出受影响路径，而不是吞掉错误。
- 不扩大事务到依赖安装；依赖安装失败只提示手动命令。

### 4. 规范 CLI 错误类型

**问题**

当前多数错误统一包装为 `CliError`，但网络错误、配置错误、安全路径错误、registry 校验错误的处理方式并不相同。

**方案**

- 增加错误 code：
  - `CONFIG_NOT_FOUND`
  - `CONFIG_INVALID`
  - `REGISTRY_FETCH_FAILED`
  - `REGISTRY_INTEGRITY_FAILED`
  - `PATH_UNSAFE`
  - `WRITE_FAILED`
- 将 `CliError` 的业务错误 code 与进程退出码分离：
  - `code` 表示稳定业务分类，例如 `REGISTRY_FETCH_FAILED`
  - `exitCode` 表示进程退出码，默认仍为 `1`
- `src/index.ts` 按 code 输出建议：
  - 配置问题提示 `init` 或 `doctor`。
  - 网络问题提示 `--registry`、`--no-cache`。
  - 安全问题显示被拒绝路径但不输出敏感堆栈。
- 命令层 catch 不得无条件 `new CliError(message)` 重包已有 `CliError`；必须保留原始 code、exitCode、cause 和必要上下文。

**验收**

- 常见失败路径都有稳定错误消息测试。
- `add`、`diff`、`update` 等命令的 catch 分支不会吞掉 `REGISTRY_FETCH_FAILED`、`REGISTRY_INTEGRITY_FAILED`、`PATH_UNSAFE` 等分类。
- `--verbose` 才显示 stack。
- `--json` 类命令后续可以输出结构化错误。

## 中期改进（P1）

### 5. 将组件元数据升级为完整单一事实源

**问题**

`shared` 目前维护组件描述和 npm 依赖；`registry` 另行维护文件映射；registry 依赖从源码 import 推导。三块分散会增加新增组件时漏填、误填的概率。

**方案**

- 将 `COMPONENTS` 从简单 meta 扩展为完整描述：
  - `name`
  - `title`
  - `description`
  - `category`
  - `dependencies`
  - `files`
  - `composables`
  - `directives`
  - `examples`
- 保留 `component-files.ts` 作为过渡期输入，最终迁入 shared。
- registry build 只消费 shared 元数据。

**验收**

- 新增组件只需要更新一个元数据入口。
- `validate-registry` 能检查源码目录、元数据、生成 JSON 三者一致。
- docs 后续也可消费同一份组件分类和描述。

### 6. 改进依赖分析策略

**问题**

registry 依赖依靠 import 字符串推导，遇到动态导入、barrel export、CSS import、类型-only import 时容易出现边界不清。

**方案**

- 使用 `es-module-lexer` 或 TypeScript AST 分析 import/export。
- 明确依赖分类：
  - registry component dependency
  - registry shared file dependency
  - npm dependency
  - style asset dependency
- 对跨组件 import 建立校验：不允许组件源码隐式依赖未登记组件。

**验收**

- `validate-registry` 能列出每个组件推导出的依赖图。
- 循环 registry 依赖在 build 阶段失败。
- CSS 文件、类型文件、barrel export 都有覆盖用例。

### 7. CLI 支持安装清单与锁定文件

**问题**

用户项目目前只落地组件文件，没有记录安装来源、registry 版本、integrity。`diff` 和 `update` 只能按当前文件与 registry latest 比较，缺少“用户安装时状态”的上下文。

**方案**

- 在用户项目生成 `.brutx/manifest.json` 或 `components.json` 扩展字段：
  - installed component name
  - registry source
  - installed integrity
  - installed at
  - files written
- `add` 更新 manifest。
- `remove` 根据 manifest 清理已知文件。
- `diff` 可比较 installed integrity 与 latest integrity。

**验收**

- `list` 能显示安装来源和是否可更新。
- `remove` 不再完全依赖目录扫描。
- 老项目没有 manifest 时仍能走兼容扫描。

### 8. 建立 CLI 集成测试矩阵

**问题**

CLI 单元测试已经覆盖较多命令，但真实项目模板、包管理器、Tailwind v3/v4、Nuxt/Vite 组合仍需要端到端验证。

**方案**

- 保持本地开发默认不跑重型集成测试。
- 在 CI 或发布门禁中跑矩阵：
  - Vite Vue + Tailwind v4
  - Vite Vue + Tailwind v3
  - Nuxt 3
  - monorepo 子包
- 每个模板验证：
  - `init`
  - `add button`
  - `add data-table`
  - `diff`
  - `remove`
  - `doctor`

**验收**

- 集成测试全部使用临时目录和本地 registry，不依赖外网。
- 每个 case 有明确失败日志和保留现场选项。
- 发布门禁包含 CLI 集成测试。

## 长期改进（P2）

### 9. Registry 发布形态升级

**方向**

当前 registry 通过 GitHub raw URL 分发，简单直接，但缺少版本索引、签名、镜像和缓存控制。

**建议**

- 保留 GitHub raw 作为默认源。
- 增加 `index.json` 版本字段和 schema 版本。
- 生成 `registry-manifest.json`：
  - registry version
  - build timestamp
  - git commit
  - item count
  - item integrity map
- 评估后续发布到 npm 包或静态 CDN。

**暂缓原因**

现阶段 raw URL 足够低成本；应先把 schema、验证和集成测试打牢。

### 10. CLI 程序化 API

**方向**

目前 CLI 主要面向命令行。未来若 docs、插件或第三方工具需要调用安装能力，可以提供受支持的 programmatic API。

**建议**

- 将命令里的核心逻辑拆到 `lib/services/`：
  - `initProject`
  - `resolveComponents`
  - `writeComponentFiles`
  - `diffComponents`
  - `removeComponents`
- CLI 命令只负责参数解析、交互和输出。
- 再考虑 `dts` 输出和 API 文档。

**实施状态：已完成**

- `lib/services/` 服务边界已建立（add/diff/init/remove 四个 service 模块），CLI 命令仅做参数解析、交互和输出。
- 新增 `src/api.ts` 作为公共入口，re-export 全部 services。
- `tsup.config.ts` 改为双入口构建：CLI 入口（`src/index.ts`，带 shebang banner、`noExternal: brutx-shared-vue`、`dts: false`）+ API 入口（`src/api.ts`，无 banner、不打包 shared、`dts: true`）。
- `package.json` 增加 `exports` 字段（`.` → `types` + `import` 条件指向 `dist/api.d.ts`/`dist/api.js`），`main`/`module`/`types` 指向 API 产物；`brutx-shared-vue` 从 `devDependencies` 移至 `dependencies`（API 入口不打包，消费者需传递依赖）。
- `tests/api.test.ts` 验证 12 个函数导出存在且为函数、`resolveComponents([])` 返回空结果、15 个类型导出运行时为 `undefined`。
- `tsconfig.json` 增加 `ignoreDeprecations: "6.0"` 以消除 TS 6.x dts 构建期间的 `baseUrl` 弃用硬错误（CLI tsconfig 本身不含 `baseUrl`，错误来自 tsup dts 构建器）。
- 验证：14 个 API 测试通过、245 个 CLI 测试全部通过、`pnpm typecheck` 通过、`dist/api.d.ts` 生成完整（12 函数 + 15 类型）、CLI bin 仍正常（`node dist/index.js --version` → `0.7.1`）。

**兼容性说明**

公开 API 现为受支持的稳定接口。后续服务边界调整应保持 `src/api.ts` re-export 的导出签名向后兼容；如需破坏性变更，应通过 major 版本升级并更新 CHANGELOG。

### 11. 元数据驱动 docs 与 registry

**方向**

当 `shared` 成为完整组件事实源后，文档站可以消费同一份元数据生成组件索引、分类、依赖信息和安装命令。

**建议**

- `shared` 增加分类、标签、稳定性等级、是否实验性。
- docs 用该元数据生成组件目录。
- registry validate 校验 docs 示例引用的组件真实存在。

**暂缓原因**

涉及 docs 站结构调整，应独立设计，不与 CLI 稳定性改造混在一起。

## 分阶段路线图

| 阶段 | 目标 | 建议任务 | 验证 |
| --- | --- | --- | --- |
| 第 1 阶段 | 消除分发链路不一致 | 共享 schema、registry 核心函数测试、错误 code | CLI registry 测试、registry 单测、registry validate、三包 typecheck |
| 第 2 阶段 | 提升用户项目写入安全 | FileTransaction、init/doctor/remove 回滚、错误提示优化 | CLI 命令单测、失败注入测试 |
| 第 3 阶段 | 降低新增组件维护成本 | 元数据合并到 shared、依赖图校验、registry 快照 | registry build 快照、组件一致性校验 |
| 第 4 阶段 | 发布级信心 | CLI 集成测试矩阵、本地 registry e2e、pack 审计 | release:check 或 CI 发布门禁 |
| 第 5 阶段 | 生态演进 | registry manifest、programmatic API、docs 元数据驱动 | 独立设计评审后实施 |

## 建议优先级清单

### P0：下一轮优先做

1. 抽出 shared registry schema 与校验器。
2. 拆分 registry build 纯函数并补单元测试。
3. 为 `init`、`doctor --fix`、`remove` 引入文件事务。
4. 建立 CLI 错误 code 和错误消息测试。

### P1：稳定后推进

1. `shared` 承接完整组件元数据。
2. registry 依赖分析改为结构化 import/export 解析。
3. 用户项目安装 manifest。
4. CLI 集成测试矩阵。

### P2：长期演进

1. registry manifest 与版本索引。
2. CLI programmatic API。
3. docs 组件目录由 shared 元数据驱动。

## 风险与取舍

- **不要一次性迁移所有元数据**：先让 shared schema 和校验器落地，再迁移 `component-files.ts`，否则影响面太大。
- **不要只迁移消费端 schema**：`build-registry.ts` 是生成端，必须同步使用 shared 类型，否则 schema 修改仍可能只在 validate/CLI 暴露问题。
- **不要在日常开发默认跑完整 e2e**：遵守项目测试最小化约定，重型矩阵放到发布门禁或 CI。
- **不要过早承诺公开 API**：CLI 内部服务化可以先做，但 `exports` 和类型声明应等边界稳定。
- **不要让缓存成为事实源**：缓存只用于性能优化，任何缓存命中都必须能被 build/validate 重新证明。
- **不要在命令层吞掉错误分类**：业务错误 code 是后续结构化输出和稳定测试的基础，catch 包装必须保留原始错误信息。

## 成功标准

完成 P0 后，辅助包应达到以下状态：

- 修改 registry schema 时，生成端和消费端会同步类型报错。
- registry 核心逻辑可以用小测试快速验证，不必每次跑全量 build。
- CLI 多步写入失败可回滚，用户项目不容易停在半安装状态。
- 常见错误有稳定、可测试、可执行的提示。
- 发布前的 registry build/validate 能证明 shared 元数据、UI 源码和 registry JSON 一致。
