---
方案类型: 流程改造与基础设施优化
状态: archived
日期: 2026-09-13
完工日期: 2026-09-13
关联文档:
  - ../../guides/COMMANDS.md
  - ../../guides/DOC_GOVERNANCE.md
---

# CI工作流性能优化与去冗余方案

---

## 一、 背景与第一性原理

在 BrutxUI Vue 3 Monorepo 项目中，持续集成（CI）体系覆盖了静态代码规范契约、源码构建与打包、跨版本单元测试（Node 22/24）、Playwright 浏览器渲染验证、CLI 集成测试、多场景真实消费方（Consumer）验证与基准压测。

基于**计算图依赖拓扑、GitHub Actions 虚拟化运行时隔离、Turborepo 缓存模型与文件系统动态链接机制的第一性原理**，对 `.github/workflows/` 目录下的工作流体系（`ci.yml`、`bench.yml`、`deploy-docs.yml`、`publish.yml`）进行系统级架构解构，现存关键耗时瓶颈与资源利用率瓶颈分析如下：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Actions CI 瓶颈与算力损耗分析               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 门禁顺序倒置与重复调度（Quality Job）                                    │
│    ├─ 重型任务后置门禁：耗时仅 2s 的轻量静态契约门禁置于 2m+ 构建之后        │
│    ├─ 重复 AST 遍历：独立执行 check:api-dependencies 与 check:exports        │
│    │  随后又在 check:contracts 中重复调度上述规则（导致 2x 重复计算）        │
│    └─ 重复单测：独立跑 button.resources.test.ts（在 Test Job 中已被全量运行）│
│                                                                             │
│ 2. 构建缓存架构适配（Build Cache Architecture）                             │
│    ├─ 本地缓存隔离：GitHub Actions 独立 VM 实例并发执行，单写不可变机制要求  │
│    │  各 Job 维护独立命名空间本地缓存，避免写入竞态导致产物被静默丢弃        │
│    ├─ 跨任务共享正解：依托 Turborepo 原生 Remote Cache（基于单 Task Hash）   │
│    │  实现跨 Job、跨 Runner 毫秒级任务产物共享                              │
│    └─ 缓存缺口补齐：Consumers Job 缺失本地 Turbo 缓存，每次均冷启动构建      │
│                                                                             │
│ 3. 依赖安装网络元数据开销                                                   │
│    └─ 各 Job 均使用 pnpm install --frozen-lockfile，在本地 Store 存在时      │
│       仍向 npm Registry 发送元数据探测请求，带来无谓的 I/O 阻塞              │
│                                                                             │
│ 4. 浏览器测试系统依赖准备耗时（Browser Job）                                │
│    └─ 每次触发 apt-get update 受微软/Azure 源网络波动影响，阻塞 20~30s       │
│                                                                             │
│ 5. PR 基准压测拓扑冗余与算力损耗（Bench Workflow）                          │
│    └─ 每次 PR 均重新拉取 main 串行执行全量基准压测（~18m 阻塞 + 双倍算力）， │
│       且跨 Runner 调度存在硬件架构差异（CPU 漂移导致伪回归信号）              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、 目标与非目标

### 1. 目标
1. **零契约损失与严格等价**：优化仅作用于工作流调度拓扑、缓存策略与环境准备，不裁剪任何既有静态契约、代码检查、类型检查、测试或安全门禁。
2. **轻量门禁快速失败（Fail-Fast）**：将耗时 ~2 秒的纯静态代码规范与生成对齐门禁前置至最先执行，静态不合规时秒级熔断退出，避免无效消耗后续重型构建算力。
3. **消除完全重复的命令调度**：静态契约检查收敛至 `check:contracts` 单一聚合入口，移除独立单跑的重复步骤与单测。
4. **规范本地与远程双层缓存体系**：为各并行 Job 保持并完善隔离的本地 Turbo Cache Key 命名空间，补齐 `consumers` 的本地缓存；跨 Job 构建产物复用完全交由 Turborepo 原生 Remote Cache 高速分发。
5. **全量开启依赖本地优先模式**：在各 Job 的 `pnpm install` 步骤中开启 `--prefer-offline`，利用 pnpm store 本地硬链接，减少网络握手开销。
6. **PR 基准压测拓扑演进**：建立“主干（main）推送固化基准 + PR 单边比对”机制，PR 压测总耗时降低 50% 以上，并节约 50% Runner 运行配额。
7. **优化浏览器测试环境准备**：清理卡顿 APT 源，优化 Playwright 依赖加载链路，消除网络阻塞。

### 2. 非目标
1. 不修改底层各单项测试（Vitest、Playwright）与门禁脚本内部业务断言逻辑；
2. 不变更既有 PR Changeset、Commitlint、版本发布状态机等发布规范。

---

## 三、 详细改造设计

### 1. `ci.yml` 任务拓扑优化

#### (1) Quality Job：Fail-Fast 顺序重组与命令收敛
调整前置校验顺序，将耗时最短的静态门禁前置；剪除内层已被覆盖的重复命令：

```yaml
# 1. 内存中只读校验生成一致性（秒级 Fail-Fast：若生成单一信源未对齐立即熔断）
- name: Verify all generated and mixed files (read-only)
  run: pnpm check:generated

# 2. 执行核心构建、类型检查与代码检查（受 Turbo 缓存加速并物化未跟踪的生成文件）
- name: Build + typecheck + lint (turbo source graph)
  run: pnpm exec turbo run build:artifact typecheck:source lint:source

# 3. 运行规范契约门禁（基于物化完成的完整源码拓扑聚合运行 7 项规则）
- name: Verify code and spec contracts (parallel)
  run: pnpm check:contracts

# 4. 运行注册表校验与深度消费/隔离测试
- name: Validate registry
  run: pnpm exec turbo run validate --filter=brutx-registry-vue

- name: Run R3b tooling fault and equivalence checks
  run: pnpm test:tooling

- name: Public type consumer check
  run: pnpm --filter brutx-ui-vue test:types

- name: Verify bundle isolation
  run: pnpm --filter brutx-ui-vue check:isolation

- name: Verify documentation integrity (parallel)
  run: pnpm check:docs

- name: Package smoke test (exports subpaths + consumer resolution)
  run: pnpm --filter brutx-ui-vue test:package

- name: Release verification and coordinator tests
  run: pnpm test:release

- name: Check bundle size limits
  run: pnpm --filter brutx-ui-vue size
```

*移除的冗余步骤说明*：
- 移除单独调用的 `pnpm check:api-dependencies` 与 `pnpm check:exports`（`pnpm check:contracts` 的并发池已全量调度）；
- 移除单独调用的 `pnpm --filter brutx-ui-vue test src/components/button/button.resources.test.ts`（在并行的 `test` job 中已被全量 Vitest 矩阵覆盖）。

#### (2) 双层缓存架构：本地隔离防护 + 远程无锁共享
- **本地缓存命名空间隔离**：
  GitHub Actions 的 Job 并行运行在不同的虚拟机中，Cache 具有“单写不可变（Write-Once）”特性。若并行 Job 混用同一 Key，后完成的任务缓存将被静默丢弃。因此每个 Job 维持独立命名空间：
  - `quality`: `key: ${{ runner.os }}-turbo-quality-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-${{ github.sha }}`
  - `test`: `key: ${{ runner.os }}-turbo-test-node${{ matrix.node-version }}-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-${{ github.sha }}`
  - `browser`: `key: ${{ runner.os }}-turbo-browser-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-${{ github.sha }}`
  - `integration`: `key: ${{ runner.os }}-turbo-integration-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-${{ github.sha }}`
  - `consumers`: 补齐专属 `turbo-consumers-` 缓存配置。
- **跨 Job 构建复用正解（Remote Cache）**：
  跨任务的产物共享由环境变量 `TURBO_TOKEN` 与 `TURBO_TEAM` 接入的 Turborepo Remote Cache 负责。Turborepo 以单 Task Hash 为单位进行 HTTP 读写，各并行 Job 可即时拉取其他 Job 构建完成的单个包产物，无锁且无并发覆盖问题。

#### (3) Consumers Job 补齐本地构建缓存
在 `ci.yml` 的 `consumers` job 中，注入 `TURBO_TOKEN`、`TURBO_TEAM` 并补充本地缓存步骤，避免每次在独立的虚拟机中全量冷启动编译：

```yaml
consumers:
    name: Real Consumer tests (U1 / C1 / C3)
    runs-on: ubuntu-latest
    env:
        TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
        TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
        - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          with:
              fetch-depth: 1

        - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10

        - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
          with:
              node-version: 22
              cache: pnpm

        - run: pnpm install --frozen-lockfile --prefer-offline

        - name: Cache turbo local build cache
          uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
          with:
              path: node_modules/.cache/turbo
              key: ${{ runner.os }}-turbo-consumers-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-${{ github.sha }}
              restore-keys: |
                  ${{ runner.os }}-turbo-consumers-${{ hashFiles('**/pnpm-lock.yaml', 'turbo.json') }}-
                  ${{ runner.os }}-turbo-consumers-

        - name: Build packages
          run: pnpm build
```

#### (4) 依赖安装全局开启 `--prefer-offline`
在各 Job 执行 `pnpm install` 步骤时统一增加 `--prefer-offline`：
```yaml
- run: pnpm install --frozen-lockfile --prefer-offline
```
在保证锁文件版本严格一致（`--frozen-lockfile`）的前提下，优先通过本地 store 硬链接生成 `node_modules`，避免针对已有包发起不必要的 HTTP 元数据网络往返。

#### (5) Playwright 浏览器准备与环境防御
保留针对可能导致网络卡顿的异常 APT 源的清理逻辑，保持对操作系统动态链接库的完整检查，确保在不同版本的 Ubuntu 镜像上均具备 100% 可用性：
```yaml
- name: Clean up problematic APT repositories
  run: |
      sudo rm -f /etc/apt/sources.list.d/azure-cli.list*
      sudo rm -f /etc/apt/sources.list.d/microsoft*

- name: Install Playwright Browser and Deps
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: pnpm --filter brutx-ui-vue exec playwright install --with-deps chromium

- name: Install Playwright Dependencies (when cache hit)
  if: steps.playwright-cache.outputs.cache-hit == 'true'
  run: pnpm --filter brutx-ui-vue exec playwright install-deps chromium
```

---

### 2. `bench.yml` 基准压测拓扑演进

#### 现存瓶颈与演进设计
- **现状缺陷**：原 `bench.yml` 在 PR 触发时串行执行 `baseline (main)` ➔ `pr-compare`。每次 PR 都在从零构建并压测没有任何变化的 `main` 分支，总耗时近 18 分钟，浪费了一倍的 GitHub Actions Runner 算力；且将两者分配在两个不同的 Runner 上容易引入 CPU 架构不一致的物理硬件噪声。
- **最佳实践模型（主干基准缓存 + PR 单路比对）**：
  1. **主干基线沉淀（Main Push）**：代码合入 `main` 分支时运行基准测试，将 `bench-main.json` 写入专用 Cache Key（如 `bench-baseline-main`）；
  2. **PR 单边比对（PR Event）**：
     - PR 触发时直接通过 `actions/cache/restore` 获取 `main` 的最新基准产物；
     - 仅需启动 **单个 Runner** 执行当前 PR 分支的构建与压测（耗时约 8~9 分钟）；
     - 若缓存命中，直接执行 `node scripts/bench-diff.mjs` 输出对比报告并评论；
     - **优雅降级**：若未命中基线缓存（如首次运行或缓存失效），自动执行内联 baseline 测量回退，保证流水线永远可用。

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PR 基准测试最佳实践拓扑                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. main 分支 push:                                                     │
│    运行 vitest bench ➔ 保存 bench-main.json 至 GitHub Actions Cache    │
│                                                                        │
│ 2. PR 分支 pull_request:                                               │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ 单一 Runner:                                                 │    │
│    │ 1. 恢复 main 基线缓存 (bench-baseline-main)                  │    │
│    │ 2. 检出 PR 代码，构建并运行 vitest bench 生成 bench-pr.json   │    │
│    │ 3. 执行 scripts/bench-diff.mjs 进行对比                      │    │
│    │ 4. 发表 / 更新 PR Performance Bench Report 评论              │    │
│    └──────────────────────────────────────────────────────────────┘    │
│    总等待时间：~8 分钟（原 18 分钟，降幅 >55%）；Runner 算力消耗减少 50%│
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. `deploy-docs.yml` 与 `publish.yml` 同步对齐

1. **依赖安装一致性**：所有 `pnpm install` 均统一采用 `--frozen-lockfile --prefer-offline`；
2. **本地缓存隔离**：保持各自独立的 Cache Key（`turbo-docs-` 与 `turbo-publish-`），继续享受 Turborepo Remote Cache 的远程加速。

---

## 四、 预期收益量化评估

| 工作流 / Job | 优化前耗时 (估计) | 优化后耗时 (估计) | 核心收益来源 |
|---|---|---|---|
| **`quality` Job** | ~2m 30s | **~1m 45s** | 静态契约 Fail-Fast 前置；剪除重复调用的 `api-dependencies`、`check:exports` 及冗余单测 |
| **`consumers` Job** | ~2m 10s | **~1m 20s** | 补齐独立本地构建缓存与 Remote Cache 结合，消除重复全量冷构建 |
| **`bench` Workflow** | ~18m 00s | **~8m 30s** | 由串行主干+PR 双重压测改为单边 PR 压测，总耗时减半，Runner 资源消耗减少 50% |
| **全局依赖安装** | ~15s / Job | **~7s / Job** | `--prefer-offline` 消除已有本地依赖包的网络元数据查询往返 |
| **异常报错反馈时效** | ~2m 00s | **~3s** | 静态门禁前置后，规范或生成不一致时可在秒级内拦截退出 |

---

## 五、 实施前瞻与验证计划

### 1. 落地分步操作
1. **第一阶段：`ci.yml` 去重、Fail-Fast 顺序重构与 `--prefer-offline` 接入**：
   - 调整 `quality` job 步骤顺序，移除重复的命令；
   - 为 `consumers` 补齐 `actions/cache` 本地缓存配置；
   - 各 Job 的 `pnpm install` 添加 `--prefer-offline`。
2. **第二阶段：`bench.yml` 拓扑精简**：
   - 增加 main 分支基准固化缓存逻辑；
   - 优化 PR 压测为单边执行与优雅降级回退。
3. **第三阶段：`deploy-docs.yml` 与 `publish.yml` 属性同步**：
   - 补充 `--prefer-offline` 选项。

### 2. 验证与门禁核验
- **静态契约自检**：运行 `pnpm check:contracts`，确保 7 项静态契约全部秒级通过；
- **生成一致性自检**：运行 `pnpm check:generated`，确保输出一致性检验无缝工作；
- **文档规范自检**：运行 `pnpm check:docs`，确保本方案 Frontmatter 与链接完全合规。
