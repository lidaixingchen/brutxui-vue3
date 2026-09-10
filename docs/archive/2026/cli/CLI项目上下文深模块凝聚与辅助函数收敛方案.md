---
方案类型: 重构 / 架构优化
状态: archived
日期: 2026-09-10
完工日期: 2026-09-10
关联文档:
  - ../../guides/DOC_GOVERNANCE.md
修订记录:
  - 2026-09-10: 架构演进为“聚合门面 + 专职子模块（环境探测器与组件扫描器）”最佳实践，明确依赖注入、I/O 收敛与测试迁移策略
---

# CLI项目上下文深模块凝聚与辅助函数收敛方案

---

## 一、 背景与架构摩擦点分析

### 1. 现状痛点

在当前 `packages/cli` 架构中，项目环境探测、路径解析与已安装组件扫描存在典型的**职责割裂**、**双重实现**与**性能放大**问题：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    当前 Project 与 Context 散落现状                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. packages/cli/src/lib/project.ts (20+ 细粒度浅函数)                       │
│    ├─ detectProjectType, detectPackageManager, detectWorkspaceRoot          │
│    ├─ readTsConfig, resolveTsConfigExtendsPath, resolveAliasPath            │
│    └─ 与 project-context.ts 中的静态方法存在完全相同的重复实现              │
│                                                                             │
│ 2. packages/cli/src/lib/installed-components.ts (浅模块代理)                 │
│    ├─ 独立实现 scanComponentFiles 与并发扫描 mapWithConcurrency              │
│    ├─ 内部反向 import { resolveAliasPath } from './project.js'              │
│    └─ 导致 resolveAliasPath 内部再次创建 ProjectContext.loadUninitialized 实例 │
│                                                                             │
│ 3. 多重实例化与重复 I/O 开销 (Performance Friction)                         │
│    └─ list / diff / add 命令在执行过程中会经历多次 loadUninitialized，重复   │
│       扫描 package.json、lockfiles 与 tsconfig 继承链                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **双重实现导致维护漂移（Maintenance Drift）**：
   `project.ts` 与 `project-context.ts` 各自维护了一套项目类型探测（`detectProjectType`）、包管理器检测（`detectPackageManager`）和 TSConfig 继承链解析逻辑。其中 `project.ts` 维护了 `projectTypeCache`，而 `project-context.ts` 缺失该缓存，导致逻辑分叉与维护漂移。
2. **循环代理与重复 I/O（Circular Proxying & I/O Waste）**：
   `installed-components.ts` 中的函数仅接收 `(cwd, config)`，但在解析组件别名目录时调用 `project.ts` 的 `resolveAliasPath`，后者内部又调用 `ProjectContext.loadUninitialized` 重新探测环境和读取磁盘配置，造成了严重的重复向上递归查找与磁盘 I/O 开销。
3. **接口散落，上层调用缺乏高阶抽象（Lack of Leverage）**：
   上层命令（`list.ts`、`diff.ts`、`doctor.ts`）需要同时引入 `ProjectContext`、`installed-components.ts` 和 `manifest.ts`，在多个浅模块之间手动胶水串联，部分命令甚至在内部再次编写递归文件遍历逻辑。

---

## 二、 架构设计：聚合门面与专职子模块拓扑

本方案遵循**深模块设计原则（Deep Modules）**：对外提供极简、高抽象、小体积的稳定接口（Small Interface），带来极高杠杆（Leverage）；内部由高内聚的专职子模块（Implementation Collaborators）分工协作，保持局部性（Locality）与算法可测试性。

### 1. 三层架构拓扑

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Callers (Commands & CLI)                         │
│             list.ts / diff.ts / doctor.ts / remove.ts / info.ts             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 极小且高抽象的统一表面 (Maximum Leverage)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                ProjectContext (Aggregate Root & Facade)                     │
│  - 拥有环境生命周期: env, tsConfig, config, fs, auditLog                     │
│  - 拥有路径与安全体系: resolveTargetPath(), resolveAliasPath(), assertSafe()  │
│  - 门面委托方法: getInstalledComponents() -> 委托专职服务                   │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
       依赖注入上下文   │                               │ 消费无状态环境结果
                       ▼                               ▼
┌─────────────────────────────────────────┐  ┌────────────────────────────────┐
│   ComponentScanner (Domain Service)     │  │  ProjectEnvDetector (Pure)     │
│   (packages/cli/src/lib/scanner)        │  │  (packages/cli/src/lib/env)    │
│   - 以 context 实例为唯一依赖注入       │  │  - detectProjectType()        │
│   - 并发扫描器 (mapWithConcurrency)     │  │  - detectPackageManager()     │
│   - AST 依赖提取 (extractDependencies)  │  │  - readTsConfig() (extends链)  │
│   - Manifest 与本地扫描结果对齐         │  │  - 进程级 mtime 缓存管理       │
└─────────────────────────────────────────┘  └────────────────────────────────┘
```

### 2. 职责边界与协作机制

1. **`ProjectEnvDetector`（底层无状态环境探测器）**：
   - 纯函数集合，负责静态项目类型、包管理器类型、工作区根目录及 TSConfig 继承链解析。
   - 维护基于 `package.json` mtime 的安全内存缓存，供 `ProjectContext.loadUninitialized` 统一消费。
   - 不依赖 `ProjectContext`，消除双重实现与循环依赖。
2. **`ProjectContext`（领域聚合根与高阶门面）**：
   - 目标项目环境全生命周期的单一权威聚合。
   - 管理工程绝对路径、别名解析、安全边界守卫（`assertSafePath`）、事务工厂（`createTransaction`）与注册表客户端。
   - 向外提供高阶门面方法（如 `ctx.getInstalledComponentInfos()`），内部直接将 `this` 注入给专职领域服务，抹除上层胶水代码。
3. **`ComponentScanner`（专职领域扫描服务）**：
   - 专职负责已安装组件并发文件扫描、AST 导入依赖解析及与 `components-manifest.json` 的元数据对齐。
   - 构造时接收 `ProjectContext` 作为一等公民依赖，全面复用 `ctx.fs`、`ctx.resolveAliasPath` 与 `ctx.requireConfig()`，从根本上杜绝跨函数重新探测与重复 I/O。

---

## 三、 核心契约与类型定义

### 1. `ProjectContext` 契约定义

```typescript
export interface ProjectEnvironmentInfo {
    readonly projectType: ProjectType;
    readonly packageManager: PackageManager;
    readonly workspaceRoot: string | null;
    readonly hasSrc: boolean;
    readonly isNuxt: boolean;
}

export interface ProjectContextOptions {
    /** 文件系统适配器（支持 MemoryFS 内存沙箱与 DiskFS） */
    fs?: FileSystemAdapter;
    /** 显式配置覆盖 */
    configOverride?: BrutalistConfig;
    /** 是否允许未初始化 components.json */
    optionalConfig?: boolean;
    /** 注册表客户端覆盖实例 */
    registryClient?: RegistryClient;
}

export class ProjectContext {
    readonly cwd: string;
    readonly fs: FileSystemAdapter;
    readonly env: ProjectEnvironmentInfo;
    readonly tsConfig: TsConfig | null;
    readonly auditLog: AuditLogStorage;

    get config(): BrutalistConfig | undefined;
    get isConfigured(): boolean;
    requireConfig(): BrutalistConfig;

    static load(cwd?: string, options?: ProjectContextOptions): Promise<ProjectContext>;
    static loadUninitialized(cwd?: string, options?: ProjectContextOptions): Promise<ProjectContext>;

    /** 路径解析与安全防护 */
    resolveTargetPath(registryPath: string): Promise<string>;
    resolveComponentsDir(): Promise<string>;
    resolveComponentDir(componentName: string): Promise<string>;
    resolveUtilsFilePath(): Promise<string>;
    resolveStyleFilePath(): Promise<string>;
    resolveAliasPath(alias: string): Promise<string>;
    assertSafePath(targetPath: string, rootDir?: string): Promise<void>;
    toRelativePosixPath(absolutePath: string): string;

    /** 源码 AST 转换 */
    transformImports(content: string, filename?: string): string;

    /** 组件扫描与元数据门面（委派给 ComponentScanner） */
    getInstalledComponentNames(): Promise<string[]>;
    getInstalledComponentInfos(): Promise<InstalledComponentInfo[]>;

    /** 事务与注册表工厂 */
    createTransaction(): FileTransaction;
    getRegistryClient(overrides?: Partial<RegistryClientOptions>): RegistryClient;
}
```

### 2. `ComponentScanner` 契约定义

```typescript
export interface ComponentScanOptions {
    /** 控制目录并发扫描上限，默认 8 */
    concurrency?: number;
}

export class ComponentScanner {
    constructor(
        private readonly ctx: ProjectContext,
        private readonly options?: ComponentScanOptions
    ) {}

    /** 获取所有已安装组件名称（合并 manifest 与磁盘扫描） */
    getInstalledNames(): Promise<string[]>;

    /** 获取已安装组件完整元数据与依赖清单 */
    getInstalledInfos(): Promise<InstalledComponentInfo[]>;

    /** 扫描指定组件目录下的所有相对文件路径 */
    scanComponentFiles(componentDir: string): Promise<string[]>;

    /** 提取指定组件目录内部的外部模块依赖 */
    extractDependencies(componentDir: string): Promise<string[]>;
}
```

---

## 四、 演进与重构步骤

### Phase 1: 建立专职子模块，消除循环 I/O 放大

1. **创建 `packages/cli/src/lib/env-detector.ts`**：
   - 迁移并统一 `project.ts` 与 `project-context.ts` 中重复的静态环境检测函数（`detectProjectType`、`detectPackageManager`、`detectWorkspaceRoot`、`readTsConfig` 及 extends 链解析）。
   - 保持基于 `package.json` 的 mtime 缓存机制，确保环境探测仅执行一次。
2. **创建 `packages/cli/src/lib/component-scanner.ts`**：
   - 将 `installed-components.ts` 的并发调度（`mapWithConcurrency`）、目录扫描（`scanComponentFiles`）与 AST 依赖解析（`extractDependencies`）重构为 `ComponentScanner` 类。
   - 构造参数直接绑定 `ProjectContext`，扫描别名目录直接调用 `this.ctx.resolveComponentsDir()`，彻底阻断对 `loadUninitialized` 的重复调用。

### Phase 2: 升级 `ProjectContext` 聚合门面

1. **接入环境探测器**：
   - `ProjectContext.loadUninitialized` 调用 `env-detector.ts` 提供的统一无状态函数，移除类内冗余的私有静态实现。
2. **挂载扫描与转换门面**：
   - 在 `ProjectContext` 实例上挂载 `getInstalledComponentNames()` 与 `getInstalledComponentInfos()`，内部实例化 `ComponentScanner(this)` 执行。
   - 别名转换方法命名统一为 `transformImports`，内部调用 `SfcAstEngine.transformImports`，保留 `resolveImportAlias` 作为兼容方法。

### Phase 3: 调用方全面收敛与测试加固

1. **重构上层命令调用**：
   - `commands/list.ts`：统一通过 `const ctx = await ProjectContext.load(cwd)` 获取配置、组件列表与注册表客户端，移除命令内部的手工胶水与重复配置读取。
   - `commands/info.ts`：移除内部私有的 `getLocalFiles` 重复文件遍历代码，直接使用 `ctx.getInstalledComponentInfos()` 或 `ComponentScanner`。
   - `commands/diff.ts`、`commands/update.ts` 与 `services/remove-service.ts`：全面改用 `context.getInstalledComponentNames()` 门面。
2. **测试解耦与接缝迁移（Test Seam Modernization）**：
   - 针对 `tests/list.test.ts`、`tests/diff.test.ts`、`tests/doctor.test.ts` 中脆弱的 `vi.mock('../src/lib/project.js')`，迁移为通过 `ProjectContext.load(cwd, { fs: memoryFs })` 注入内存文件系统。
   - 确保测试验证的是真实对外行为，而非内部脆弱的函数调用链。

### Phase 4: 清理浅模块与废弃导出

1. **安全移除废弃文件**：
   - 确认无外部引用的前提下，移除 `packages/cli/src/lib/project.ts` 与旧版 `packages/cli/src/lib/installed-components.ts`。
2. **规范导出边界**：
   - 更新 `packages/cli/src/lib/index.ts`，导出 `ProjectContext`、`ComponentScanner` 以及必要的公共类型。
   - 严格保证 `packages/cli/src/api.ts` 的公共服务签名完整兼容。
3. **运行全原子自检验证**：
   - 运行 `pnpm --filter brutx-vue test`、`pnpm --filter brutx-vue typecheck` 与 `pnpm check:contracts`，确保多包与单工程测试全部绿灯通过。

---

## 五、 收益与验证指标

1. **杠杆率（Leverage）**：
   - 上层命令无需再同时调度配置读取器、环境探测器、注册表客户端与组件扫描器，仅需持有 `ProjectContext` 即可调用完整上下文能力。
2. **局部性与可维护性（Locality）**：
   - 彻底消除 150+ 行重复代码与环境探测缓存漂移隐患。
   - 组件扫描并发策略与 AST 分析算法内聚在 `ComponentScanner` 专职服务中，职责清晰，方便独立扩展与针对性单测。
3. **性能提升（Performance Gains）**：
   - 组件扫描过程彻底杜绝重复的 `loadUninitialized` 实例化，减少多次向上递归扫描工作区与磁盘 TSConfig 链的耗时，组件批量操作性能提升。
4. **测试健壮性（Robust Testability）**：
   - 终结模块级脆弱 Mock，全面拥抱基于 `FileSystemAdapter` 的沙箱化测试，提升测试用例对底层重构的耐受度。
