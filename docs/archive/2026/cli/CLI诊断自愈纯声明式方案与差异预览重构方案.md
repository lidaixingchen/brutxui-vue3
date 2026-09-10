---
方案类型: 重构 / 架构优化
状态: archived
日期: 2026-09-10
完工日期: 2026-09-10
关联文档:
  - ../../guides/DOC_GOVERNANCE.md
修订记录:
  - 2026-09-10: 初始版本定稿，规划诊断自愈纯声明式 RepairPlan 与静态差异预览重构
  - 2026-09-10: 评审修正，补全动作基语、冲突门禁、判别联合契约与全景差异预览模型
---

# CLI诊断自愈纯声明式方案与差异预览重构方案

---

## 一、 背景与架构目标

### 1. 现状痛点

在当前 `packages/cli` 的诊断系统（`DiagnosticEngine`）中，虽然巡检过程（`check()`）已实现纯只读的数据输出，但自愈修复过程（`fix()`）仍存在命令式副作用泄漏与接口职责耦合：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    当前 Diagnostic 修复 Seam 架构现状                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. DiagnosticRepairContext 状态过度暴露                                     │
│    ├─ 暴露底层可变事务 transaction: FileTransaction                         │
│    ├─ 暴露可变配置 mutableConfig: BrutalistConfig                           │
│    ├─ 暴露手动脏标记回调 markConfigDirty: () => void                        │
│    └─ 规则实现者必须手动编排文件写入与脏标记调用，极易遗漏                   │
│                                                                             │
│ 2. 规则逻辑与事务调度紧耦合 (Imperative Execution)                          │
│    ├─ config-rules 手动修改 mutableConfig 并调用 markConfigDirty()           │
│    ├─ tailwind-rules / integrity-rules 手动调用 transaction.writeFile        │
│    └─ 规则无法作为纯计算函数独立进行轻量断言，单测被迫构造复杂事务环境       │
│                                                                             │
│ 3. 缺乏零副作用的静态自愈预览 (Lack of Dry-run Preview)                     │
│    └─ doctor --fix --dry-run 依赖真实写入临时备份再统一回滚，无法在          │
│       内存中直接生成精确到文件与行级的拟变更差异报告（Diff Preview）         │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **规则编写者承担过多事务状态机维护成本**：
   规则实现必须手动兼顾文件事务与配置持久化调用。若漏调 `markConfigDirty()`，配置写入静默丢失；若规则内直接调用非事务 I/O，会破坏自愈原子性。
2. **测试表面过宽**：
   单测为了验证规则自愈逻辑，必须实例化完整的虚拟文件系统、真实/模拟事务环境与项目上下文。
3. **缺乏零副作用的静态预览能力**：
   终端交互式修复与 CI 门禁需要“提前向用户展示拟变更内容（Preview before apply）”。目前的黑盒写入模式无法纯在内存中推演完整的变更差异。

### 2. 架构目标

1. **纯声明式自愈 Seam**：将规则自愈改造为无写副作用的确定性计划生成器，输出强类型不可变的 `RepairPlan`。
2. **事务调度与冲突防御彻底收口**：由 `DiagnosticEngine` 作为单一聚合根统一负责路径冲突检测、原子事务编排与配置持久化。
3. **零写盘全景差异预览**：纯内存生成覆盖项目所有文件（包含 `components.json` 与代码文件）的 Unified Diff 预览，赋能 `doctor --fix --dry-run`。
4. **单测表面轻量化**：自愈单测全面转向纯数据输入输出断言。

---

## 二、 核心架构设计与类型契约

### 1. 架构总览

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DiagnosticRule.planFix(ctx, result)                        │
│   Read-Only Pure Computation: Returns Immutable PlanFixResult               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ PlanFixResult (planned / skipped / failed)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DiagnosticEngine (Orchestrator & Executor)                 │
│  ┌───────────────────────────────┐     ┌──────────────────────────────────┐ │
│  │ 1. Plan Harvester             │     │ 2. Pre-flight Collision Gate     │ │
│  │    (Collect & Categorize)     │     │    (Path Conflict Detection)     │ │
│  └───────────────┬───────────────┘     └──────────────────┬───────────────┘ │
│                  │                                        │                 │
│  ┌───────────────▼───────────────┐     ┌──────────────────▼───────────────┐ │
│  │ 3. Dry-run Diff Formatter     │     │ 4. Single Transaction Committer  │ │
│  │    (Unified Diff Generator)   │     │    (Atomic Commit / Rollback)    │ │
│  └───────────────────────────────┘     └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. 类型契约定义

在 [`packages/cli/src/lib/diagnostics/types.ts`](../../../../packages/cli/src/lib/diagnostics/types.ts) 中建立完备的声明式自愈模型：

```typescript
import type { FixId, BrutalistConfig } from '../types.js';

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 纯数据自愈原子动作（100% 可序列化、无写副作用） */
export type RepairAction =
    | {
          readonly type: 'write-file';
          readonly filePath: string;
          readonly content: string;
          readonly description?: string;
      }
    | {
          readonly type: 'ensure-dir';
          readonly dirPath: string;
          readonly description?: string;
      }
    | {
          readonly type: 'remove-path';
          readonly targetPath: string;
          readonly recursive?: boolean;
          readonly description?: string;
      }
    | {
          readonly type: 'patch-config';
          readonly patch: DeepPartial<BrutalistConfig>;
          readonly description?: string;
      };

/** 单项自愈计划 */
export interface RepairPlan {
    readonly fixId: FixId | string;
    readonly ruleId: string;
    readonly description: string;
    readonly actions: readonly RepairAction[];
}

/** 规则自愈规划结果判别联合体 */
export type PlanFixResult =
    | {
          readonly status: 'planned';
          readonly plan: RepairPlan;
      }
    | {
          readonly status: 'skipped';
          readonly reason: string;
      }
    | {
          readonly status: 'failed';
          readonly reason: string;
      };

/** 诊断规则核心契约 */
export interface DiagnosticRule {
    readonly id: string;
    readonly category: DiagnosticCategory;
    readonly name: string;
    readonly defaultSeverity?: 'warn' | 'error';
    readonly requiresConfig?: boolean;
    readonly network?: boolean;
    readonly helpUrl?: string;

    /** 纯只读巡检 */
    check(ctx: DiagnosticContext): Promise<CheckResult | CheckResult[]>;

    /** 纯只读自愈方案生成器（零写副作用） */
    planFix?(ctx: DiagnosticContext, result: CheckResult): Promise<PlanFixResult>;
}

/** 文件级差异预览项 */
export interface FileDiffPreview {
    readonly filePath: string;
    readonly changeType: 'create' | 'modify' | 'delete';
    readonly oldContent: string | null;
    readonly newContent: string | null;
    readonly unifiedDiff: string;
}

/** 全局自愈预览报告（用于 --dry-run 与交互式确认） */
export interface RepairPreviewReport {
    readonly plans: readonly RepairPlan[];
    readonly skipped: ReadonlyArray<{ readonly ruleId: string; readonly reason: string }>;
    readonly failed: ReadonlyArray<{ readonly ruleId: string; readonly reason: string }>;
    readonly fileDiffs: readonly FileDiffPreview[];
    readonly configChanges?: {
        readonly before: BrutalistConfig;
        readonly after: BrutalistConfig;
    };
}
```

---

## 三、 Engine 调度流水线与执行生命周期

`DiagnosticEngine` 作为自愈执行管线的统一调度器，执行严格的 5 阶段确定性生命周期：

```text
[阶段 1: 计划收集] Collect Plans
      │  并发执行各规则的 planFix(ctx, check)，产出 PlanFixResult
      ▼
[阶段 2: 冲突与安全门禁] Collision & Security Gate
      │  1. 路径穿越校验（assertSafePath）
      │  2. 同文件多重写入检测（Path Collision Detection）
      ▼
[阶段 3: 内存差异推演] In-memory Diff Simulation
      │  1. 聚合 patch-config，推演 components.json 最终状态
      │  2. 结合 ctx.fs 生成包含代码与配置在内的完整 FileDiffPreview 列表
      │  3. 若为 dryRun 模式，直接返回 RepairPreviewReport 并提前终止（零磁盘 I/O）
      ▼
[阶段 4: 原子事务提交] Atomic Transaction Execution
      │  1. 启动统一 FileTransaction
      │  2. 拓扑有序执行：ensure-dir -> remove-path -> write-file
      │  3. 统一将新配置写入 components.json
      │  4. transaction.commit() 原子落盘（遇错自动 rollback）
      ▼
[阶段 5: 权威闭环复检] Re-diagnose
         重新执行 diagnose()，输出权威最新报告
```

### 1. 安全与冲突门禁（Pre-flight Gate）
- **路径遍历防御**：在解析所有 Action 目标路径时，统一调用 `assertSafePath`，杜绝非法跨目录写操作。
- **路径写冲突检测**：收集所有 Plan 中的 `write-file` 与 `remove-path` 动作，按规范化路径分组。若同一目标路径存在多于一个写入源且写入内容不一致，立即标记为冲突并拒绝执行，杜绝隐式覆盖。

### 2. 差异全景统一生成（Unified Diff Preview）
- 使用项目中已集成的 `diff` 依赖（`createTwoFilesPatch` 或 `diffLines`）生成标准化 Unified Diff。
- **配置与文件视图合流**：所有 `patch-config` 动作由引擎深度合并为目标配置对象，推演生成 `components.json` 序列化文本，并作为普通文件 Diff 纳入 `fileDiffs`。开发者在终端或 CI 中可获得统一风格的文件修改视图。

### 3. 事务拓扑有序执行
引擎内部在真实应用阶段保证有序性：
1. 先创建目录（`ensure-dir`）。
2. 再移除无效/孤立文件（`remove-path`）。
3. 执行文件写入（`write-file`）。
4. 最终持久化写回配置。

---

## 四、 规则重构实现指引

各领域规则遵循纯只读设计，杜绝在 `planFix` 中直接写盘或修改 `ctx`：

### 1. Config 规则群（[`packages/cli/src/lib/diagnostics/rules/config-rules.ts`](../../../../packages/cli/src/lib/diagnostics/rules/config-rules.ts)）
- `configSchemaRule`：
  ```typescript
  return {
      status: 'planned',
      plan: {
          fixId: FixId.AddSchema,
          ruleId: 'config.schema',
          description: 'Add $schema URL to components.json',
          actions: [{ type: 'patch-config', patch: { $schema: SCHEMA_URL } }],
      },
  };
  ```
- `configVersionRule`：
  ```typescript
  return {
      status: 'planned',
      plan: {
          fixId: FixId.AddConfigVersion,
          ruleId: 'config.version',
          description: `Update $version to ${CURRENT_CONFIG_VERSION}`,
          actions: [{ type: 'patch-config', patch: { $version: CURRENT_CONFIG_VERSION } }],
      },
  };
  ```

### 2. Tailwind 规则群（[`packages/cli/src/lib/diagnostics/rules/tailwind-rules.ts`](../../../../packages/cli/src/lib/diagnostics/rules/tailwind-rules.ts)）
- `tailwindTokensRule`：
  - 读取现有 CSS 内容，纯内存计算标记块替换与 import 注入。
  - 返回对应文件的 `write-file` Action（若存在独立 tokens 路径，一并返回 `ensure-dir` 与 `write-file`）。

### 3. Structure 规则群（[`packages/cli/src/lib/diagnostics/rules/structure-rules.ts`](../../../../packages/cli/src/lib/diagnostics/rules/structure-rules.ts)）
- `structureComponentsDirRule`：
  - 返回 `ensure-dir` Action，指定组件目录绝对/相对路径。
- `structureUtilsFileRule`：
  - 返回 `write-file` Action，以 `UTILS_TEMPLATE` 为内容。
- `structureUtilsCnRule`：
  - 若 `utils` 文件不存在，返回 `{ status: 'skipped', reason: 'Utils file not found on disk. Create utils file first.' }`。
  - 若存在，纯内存计算补齐 `cn`、`FOCUS_RING_CLASSES` 与颜色扩展后的代码，返回 `write-file` Action。

### 4. Integrity 规则群（[`packages/cli/src/lib/diagnostics/rules/integrity-rules.ts`](../../../../packages/cli/src/lib/diagnostics/rules/integrity-rules.ts)）
- `integrityManifestFilesRule` / `integrityHashDriftRule`：
  - 只读方式从注册表客户端拉取对应组件源码（支持利用缓存）。
  - 若文件数不匹配或网络异常，返回 `{ status: 'failed', reason: '...' }`。
  - 正常情况下，针对组件所有目标文件生成批量 `write-file` Actions。
- `integrityOrphansRule`：
  - 计算孤立文件集合，为每个孤立项生成 `remove-path` Action。

---

## 五、 重构演进步骤

### Phase 1: 契约建立与类型改造
1. 在 [`packages/cli/src/lib/diagnostics/types.ts`](../../../../packages/cli/src/lib/diagnostics/types.ts) 中新增 `RepairAction`、`RepairPlan`、`PlanFixResult` 与 `RepairPreviewReport` 类型。
2. 彻底废弃可变的 `DiagnosticRepairContext` 接口，规则自愈统一收敛到只读 `DiagnosticContext`。

### Phase 2: Engine 核心调度器重构
1. 在 [`packages/cli/src/lib/diagnostics/engine.ts`](../../../../packages/cli/src/lib/diagnostics/engine.ts) 中实现 `previewRepair` 核心逻辑（纯内存聚合 patch-config、路径冲突校验与 Unified Diff 生成）。
2. 重构 `DiagnosticEngine.repair`，以 `previewRepair` 结果为输入，按动作拓扑批量执行单一事务写入与回滚控制。

### Phase 3: 诊断规则全量声明式迁移
1. 重构 `config-rules.ts`，消除对 `mutableConfig` 和 `markConfigDirty` 的直接操作。
2. 重构 `structure-rules.ts` 与 `tailwind-rules.ts`，消除直接针对 `transaction` 的写入。
3. 重构 `integrity-rules.ts`，将组件还原与孤立文件清理转化为 Actions 生成。

### Phase 4: CLI 终端多态输出集成
1. 在 [`packages/cli/src/commands/doctor.ts`](../../../../packages/cli/src/commands/doctor.ts) 中增加 `--dry-run` 预览分支：调用 `previewRepair()` 并在终端高亮输出行级差异。
2. 完善非交互式与交互式确认提示，让用户在真正写盘前清晰审查所有拟变更内容。

### Phase 5: 测试用例全面轻量化重构
1. 将各规则的修复单测重构为纯数据断言（直接验证 `planFix` 返回的 `actions` 与 `status`）。
2. 新增针对 Engine 路径冲突门禁、Diff 渲染与事务回滚的覆盖性集成测试。

---

## 六、 收益与验证指标

- **Test Surface 纯净化**：规则自愈测试消除所有事务环境与文件系统 Mock，单测粒度聚焦于纯逻辑计算，运行效率显著提升。
- **Locality 内聚性**：事务生命周期、文件写入与配置持久化收口至 `DiagnosticEngine` 单一聚合根，规则无从发生副作用泄漏。
- **Leverage 复用杠杆**：统一生成的 `RepairPreviewReport` 可无缝接入终端渲染、CI 注解与未来可视化 GUI 界面，实现零代码冗余的差异预览。
