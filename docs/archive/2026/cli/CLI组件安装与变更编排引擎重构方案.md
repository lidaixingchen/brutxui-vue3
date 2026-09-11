---
方案类型: 底层架构重构与模块深化
状态: archived
日期: 2026-09-11
完工日期: 2026-09-11
关联文档:
  - ../../guides/DOC_GOVERNANCE.md
  - ../../guides/COMMANDS.md
  - ../../reports/audits/技术债审查报告.md
---

# CLI组件安装与变更编排引擎重构方案

---

## 一、 背景与第一性原理

### 1. 现状痛点分析

在 BrutxUI CLI（`packages/cli`）当前的实现中，组件安装（`add`）与组件升级（`update`）两条核心工作流存在严重的**浅模块（Shallow Module）**、**业务编排外溢（Orchestration Leakage）**与**事务一致性穿孔**：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          当前 CLI 组件安装与升级架构现状                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. packages/cli/src/lib/services/add-service.ts (浅模块与多态参数负担)      │
│    ├─ resolveComponentFilePath: 仅 10 行，纯透传 context.resolveTargetPath  │
│    ├─ writeComponentFiles: 联合重载签名（contextOrItems/itemsOrConfig）     │
│    └─ 仅负责机械写盘，不管理事务提交、哈希计算、清单持久化与依赖安装         │
│                                                                             │
│ 2. packages/cli/src/commands/add.ts (412 行，编排职责严重超载)              │
│    ├─ 手写依赖解析、MergeExecutor 3-way 分支判断与 dry-run 回调             │
│    ├─ 维护事务 FileTransaction、捕获异常执行 rollback                       │
│    ├─ updateInstalledComponents 未传 transaction，导致 manifest 穿孔直接落盘 │
│    ├─ ensureUtilsFile 与 mergeSnippetsFile 游离在事务边界之外                │
│    └─ 手动调用 updateInstalledComponents 与 PackageManagerAdapter 安装依赖  │
│                                                                             │
│ 3. packages/cli/src/commands/update.ts (368 行，高比例重复编排与逻辑遗漏)   │
│    ├─ 重复实现与 add.ts 同构的 MergeExecutor 执行与冲突标记追踪             │
│    ├─ 重复实现哈希计算、manifestEntries 组装与 updateInstalledComponents 写入│
│    ├─ 重复维护事务提交与回滚生命周期                                        │
│    └─ 遗漏新版本引入的新增 npm 依赖项解析与自动安装调度                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **服务层浅薄，导致核心编排大量泄漏至命令层（Orchestration Leakage）**：
   - CLI 命令层（`commands/*.ts`）应当作为极其纯粹的**终端适配器（CLI Adapter）**，仅负责命令行参数解析、交互式问询（`@inquirer/prompts`）、终端输出与加载动画（`ora`/`chalk`）。
   - 现状是：`add.ts` 与 `update.ts` 各自堆砌了近 400 行低层级代码，手动调度依赖解析、3-way 合并、事务回滚、哈希计算、`installed-components.json` 清单更新以及包管理器依赖安装。
2. **状态一致性漏洞与事务边界穿孔**：
   - `add.ts` 在调用 `updateInstalledComponents` 时漏传了 `{ transaction }`，使得清单更新直接落盘；若后续事务提交失败或抛错，回滚操作无法撤销清单记录，造成“组件源码已回滚删除，清单却标记已安装”的不一致状态。
   - `ensureUtilsFile`（`cn.ts`）与 `mergeSnippetsFile`（VS Code snippets）游离于事务边界之外，异常时残留孤立文件。
   - `update.ts` 遗漏了对新版本组件新增 npm 依赖项的检查与自动安装。
3. **`add-service.ts` 的浅模块与多态接口债务**：
   - `resolveComponentFilePath()` 是纯透传（直接代理 `context.resolveTargetPath`），无任何行为深度；
   - `writeComponentFiles()` 接收 `contextOrItems: ProjectContext | RegistryItem[]`、`itemsOrConfig: RegistryItem[] | BrutalistConfig`，通过 `instanceof` 与类型判断实现多套兼容分支，接口表面积庞杂且缺乏事务闭环。

### 2. 移除性测试（Deletion Test）

- **删除 `resolveComponentFilePath`**：
  调用方直接使用 `context.resolveTargetPath()`，消除无意义的间接抽象。
- **提取深模块 `ComponentMutationEngine` 并收敛编排**：
  `add.ts` 与 `update.ts` 中超过 400 行重复与易错的底层逻辑被彻底吸收入深模块内部；命令层缩减为 60-80 行干净的交互式参数收集与结果展示；编程式 API（`packages/cli/src/api.ts`）直接复用该引擎，获得 100% 一致的变更行为与原子事务保证。

---

## 二、 目标与非目标

### 1. 目标
- **构建 Plan-Execute 双阶段深模块（ComponentMutationEngine）**：
  - **Plan 阶段**：以 `ProjectContext` 为上下文基石，纯内存解析依赖树、本地文件比对、3-way merge 差异计算与冲突检测，生成只读的 `ComponentMutationPlan`。天然支持确定性的 `--dry-run` 预览与终端交互。
  - **Execute 阶段**：在单一 `FileTransaction` 边界内，原子写入组件源码、工具函数文件（`cn.ts`）、代码片段（VS Code snippets）与清单（`manifest.json`），并在事务提交成功后调度包管理器执行 npm 依赖安装。
- **重构命令层为纯终端适配器（Thin CLI Adapters）**：
  `commands/add.ts` 与 `commands/update.ts` 仅负责交互问询（多选组件、确认覆盖）与进度渲染，对底层变更统一通过单一引擎发起。
- **全资源原子事务闭环**：
  组件源码、`cn.ts`、`manifest.json` 与 `.vscode/brutx.code-snippets` 统一纳入单个文件事务，实现 100% 全量提交或全量回滚。
- **结构化依赖安装结果**：
  依赖安装生命周期清晰建模，支持精细化反馈安装状态、异常捕获与手动重试指引命令。
- **实现全链路零 IO 单元测试**：
  组件变更引擎基于 `brutx-shared-vue/fs` 的 `MemoryFileSystemAdapter` 运行，无需触碰真实磁盘即可测试组件添加、更新、3-way 合并与异常回滚全流程。

### 2. 非目标
- 不变更 Registry JSON 数据源协议与组件代码格式。
- 不改动当前 CLI 的控制台交互流程与文案配色。

---

## 三、 核心架构设计与领域契约

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Callers (Thin Adapters)                         │
│     CLI add command          CLI update command       Programmatic API │
└────────────┬─────────────────────────┬────────────────────────┬────────┘
             │                         │                        │
             ▼                         ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ComponentMutationEngine (深模块单一 Seam)                 │
│                                                                        │
│  Phase 1: Pure Mutation Planning (Zero-IO, Read-Only)                  │
│  • planInstall(options): Promise<ComponentMutationPlan>                │
│  • planUpdate(options): Promise<ComponentMutationPlan>                 │
│                                                                        │
│  Phase 2: Atomic Transaction Execution & Post-Tasks                    │
│  • execute(plan, options): Promise<ComponentMutationResult>           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Hidden Implementation                        │  │
│  │  1. Dependency Tree Resolver (RegistryClient & Cache)            │  │
│  │  2. Merge & Conflict Planner (MergeExecutor 3-way engine)        │  │
│  │  3. Unified File Transaction Boundary (sources, utils, snippets) │  │
│  │  4. Hash & Manifest Synchronizer (computeHash, updateManifest)   │  │
│  │  5. Package Manager Executor (pnpm / npm / yarn / bun)           │  │
│  │  6. Structured Audit Logger (withAuditLog integration)           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ 依托注入
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      ProjectContext (一等公民上下文)                    │
│  • Config & Target Path Resolver     • FileTransaction Factory         │
│  • Import Alias Rewriter             • Universal FileSystemAdapter     │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. 变更引擎核心接口契约

位于 `packages/cli/src/lib/services/component-mutation-engine.ts`：

```typescript
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem } from '../types.js';

export type PlanFileAction = 'create' | 'overwrite' | 'merge' | 'skip';

export interface MutationPlanFile {
    componentName: string;
    filePath: string;
    action: PlanFileAction;
    sourceContent: string;
    mergedContent?: string;
    hasConflicts?: boolean;
    conflictMarkers?: boolean;
}

export interface ComponentMutationPlan {
    /** 待处理的组件列表（含解析出的依赖项） */
    items: RegistryItem[];
    /** 计划写入、更新或跳过的文件详情清单 */
    files: MutationPlanFile[];
    /** 需要安装的 npm 依赖包 */
    npmDependencies: string[];
    /** 是否需要生成/更新 cn.ts 工具辅助文件 */
    ensureUtils: boolean;
    /** 是否需要更新 VS Code 代码片段 */
    updateSnippets: boolean;
    /** 命中并解析该组件的注册表源映射 */
    registrySources: Record<string, string>;
    /** 组件版本映射（显式指定或锁定版本） */
    versionByName: Map<string, string>;
}

export interface ComponentPlanOptions {
    /** 目标安装或更新的组件名称（支持带版本，如 button、card@1.0.0） */
    components: string[];
    /** 是否强制覆盖已有文件 */
    overwrite?: boolean;
    /** 是否启用 3-way 智能合并 */
    merge?: boolean;
    /** 3-way 合并冲突策略 */
    conflictStrategy?: 'ours' | 'theirs' | 'markers';
    /** 自定义注册表地址覆盖 */
    registryOverride?: string;
    /** 是否使用缓存 */
    useCache?: boolean;
    /** 是否更新 VS Code 代码片段（默认自动检测） */
    vscode?: boolean;
}

export interface MutationCallbacks {
    onProgress?: (info: { component: string; current: number; total: number }) => void;
    onFileWritten?: (info: { component: string; filePath: string; action: PlanFileAction }) => void;
    onDependencyStart?: (packages: string[]) => void;
}

export interface ComponentExecuteOptions {
    /** 演练模式（仅触发事件与校验，不提交事务与执行外部命令） */
    dryRun?: boolean;
    /** 是否跳过安装 npm 依赖包 */
    skipDependencies?: boolean;
    /** 执行回调 */
    callbacks?: MutationCallbacks;
}

export interface DependencyInstallResult {
    status: 'installed' | 'skipped' | 'failed';
    packages: string[];
    manualCommand?: string;
    error?: string;
}

export interface ComponentMutationResult {
    /** 成功处理的组件列表 */
    succeeded: string[];
    /** 跳过的组件列表 */
    skipped: string[];
    /** 实际写入或合并的目标物理文件路径列表 */
    filesWritten: string[];
    /** 存在未决冲突标记的文件明细 */
    conflicts: Array<{ component: string; conflictFiles: string[] }>;
    /** npm 依赖安装执行明细 */
    dependencies: DependencyInstallResult;
    /** 是否成功更新并提交了 installed-components.json 清单 */
    manifestUpdated: boolean;
    /** 变更统计 */
    stats: {
        createdFiles: number;
        mergedFiles: number;
        skippedFiles: number;
    };
}
```

### 2. 变更引擎核心类定义

```typescript
export class ComponentMutationEngine {
    constructor(private readonly context: ProjectContext) {}

    /**
     * 阶段一：纯函数式规划（Plan 阶段）
     * 负责依赖解析、本地文件比对与 3-way 合并计划计算，无任何磁盘与外部副作用。
     */
    async planInstall(options: ComponentPlanOptions): Promise<ComponentMutationPlan>;

    /**
     * 针对已有组件的更新规划（Plan 阶段）
     * 结合本地文件与 Registry 远端最新版本计算合并差异与冲突标记。
     */
    async planUpdate(options: ComponentPlanOptions): Promise<ComponentMutationPlan>;

    /**
     * 阶段二：原子事务执行（Execute 阶段）
     * 统一接管全量文件事务、清单写入、哈希校验与依赖调度。
     */
    async execute(plan: ComponentMutationPlan, options?: ComponentExecuteOptions): Promise<ComponentMutationResult>;
}
```

### 3. 事务与一致性保证（Transaction Invariants）

1. **全域资源原子事务闭环**：
   - 变更引擎启动时通过 `context.createTransaction()` 创建文件事务；
   - 工具文件 `ensureUtilsFile`、组件源码文件、VS Code 代码片段 `mergeSnippetsFile` 统一通过 `transaction.writeFile()` 缓冲写入；
   - 任意文件写入异常或验证失败时，引擎自动捕获并触发 `await transaction.rollback()`，保证磁盘 100% 还原。
2. **清单同事务一致性**：
   - 组件文件写入完毕后，基于新内容计算 `computeInstalledContentHash`；
   - 调用 `updateInstalledComponents` 时必须显式传递 `{ transaction }`，将清单改动合并至同一事务；
   - 仅当全部写入与清单更新就绪后，执行 `await transaction.commit()` 一次性落盘。
   - `dryRun: true` 下严格禁止执行 `commit()`。
3. **延迟且受控的包管理器调度**：
   - npm 依赖安装耗时较长且不可逆，严格限定在事务成功 `commit()` 后执行；
   - 若包管理器执行失败，引擎捕获异常并生成结构化 `DependencyInstallResult`（含 `getManualInstallCommand` 命令行指引），保证调用方明确知晓状态，避免静默失败或事务状态混淆。

---

## 四、 涉及模块重构与接口收敛

### 1. `packages/cli/src/lib/services/component-mutation-engine.ts`（新建深模块）
- 承载 `ComponentMutationEngine` 完整实现；
- 整合 `RegistryClient`、`MergeExecutor`、`FileTransaction`、`PackageManagerAdapter` 与清单同步。

### 2. `packages/cli/src/lib/services/add-service.ts`（破坏式精简）
- 彻底移除浅穿透函数 `resolveComponentFilePath`；
- 移除多态重载签名，底层文件写入逻辑收敛至 `ComponentMutationEngine`；
- 保留 `ensureUtilsFile` 作为纯净无副作用的工具函数供引擎内部调用。

### 3. `packages/cli/src/commands/add.ts`
- 消除手写的文件循环、哈希计算、事务提交与清单写入；
- 命令函数纯化为：
  1. 收集交互参数并解析目标工作区 `ProjectContext`；
  2. 调用 `engine.planInstall()` 生成计划并展示；
  3. 若非 `--yes` 且有跳过/覆盖项，向用户展示计划确认；
  4. 调用 `engine.execute()` 完成落地并输出状态。

### 4. `packages/cli/src/commands/update.ts`
- 消除 3-way 合并手工循环与事务回滚样板代码；
- 命令函数纯化为：
  1. 收集已安装组件并利用 `diffComponent` 检测待更新项；
  2. 交互式多选需更新的组件列表；
  3. 调用 `engine.planUpdate()` 准备合并计划；
  4. 调用 `engine.execute()` 完成变更并输出冲突提示与依赖安装结果。

### 5. `packages/cli/src/api.ts`
- 导出 `ComponentMutationEngine`、`ComponentMutationPlan` 与 `ComponentMutationResult` 等核心领域模型，向编程式调用方提供工业级事务与规划能力。

---

## 五、 实施路线与任务分解

| 阶段 | 交付目标 | 核心改动文件 | 验收条件 |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 变更编排深模块构建 | `packages/cli/src/lib/services/component-mutation-engine.ts`<br>`packages/cli/tests/component-mutation-engine.test.ts` | 内存文件系统单元测试全绿，覆盖计划生成、覆盖、3-way 合并与异常全量回滚 |
| **Phase 2** | add 命令层迁移 | `packages/cli/src/commands/add.ts`<br>`packages/cli/src/lib/services/add-service.ts` | add 命令交互、dry-run、Monorepo 目标定位与静默安装全量测试通过 |
| **Phase 3** | update 命令层迁移 | `packages/cli/src/commands/update.ts` | update 命令检测、冲突标记生成与依赖自动补全测试全量通过 |
| **Phase 4** | 公开 API 收敛与全量门禁 | `packages/cli/src/api.ts`<br>`packages/cli/src/lib/index.ts` | 子包测试、类型检查、`pnpm check:contracts` 与 `pnpm check:docs` 全绿通过 |

---

## 六、 质量门禁与测试策略

1. **虚拟文件系统零 IO 单元测试**：
   - 新增 `packages/cli/tests/component-mutation-engine.test.ts`；
   - 基于 `MemoryFileSystemAdapter` 模拟标准项目目录：
     - **纯计划测试**：验证 `planInstall` 与 `planUpdate` 正确识别文件动作（`create` / `merge` / `skip` / `overwrite`），不产生任何磁盘副作用；
     - **原子事务与回滚测试**：模拟中间文件写入抛错，验证已缓冲的文件、`cn.ts`、`manifest.json` 与代码片段 100% 干净回滚；
     - **依赖调度测试**：验证 `skipDependencies: true` 与 `false` 时的状态返回。
2. **命令层终端适配器轻量化测试**：
   - 验证 `commands/add.test.ts` 与 `commands/update.test.ts`，确保 CLI 参数、问询交互与引擎调用契约无缝衔接。
3. **自动化工程门禁**：
   - `pnpm --filter brutx-vue test`：子包单元测试全绿；
   - `pnpm --filter brutx-vue typecheck`：严格类型检查零错误；
   - `pnpm check:contracts`：静态契约门禁全绿；
   - `pnpm check:docs`：文档与链接校验全绿。

---

## 七、 验收标准与交付物

- [ ] `ComponentMutationEngine` 深模块成型，以 `ProjectContext` 为上下文基石，实现 Plan-Execute 双阶段解耦。
- [ ] 组件源码、`cn.ts`、`manifest.json` 与 VS Code 代码片段完整纳入统一 `FileTransaction`，杜绝清单穿孔与孤立文件残留。
- [ ] `add.ts` 与 `update.ts` 消除重复的 400+ 行编排样板代码，退化为纯终端适配器。
- [ ] 破坏式移除 `resolveComponentFilePath` 等浅穿透与多态重载签名。
- [ ] 虚拟文件系统（MemoryFileSystemAdapter）全链路覆盖变更规划、执行与异常回滚。
- [ ] 门禁 `pnpm check:docs` 与 `pnpm check:contracts` 一次性通过。
