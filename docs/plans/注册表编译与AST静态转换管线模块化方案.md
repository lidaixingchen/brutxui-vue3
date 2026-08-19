# 注册表编译与AST静态转换管线模块化方案

> 方案类型：底层架构重构与深模块封装
> 状态：**active**
> 日期：2026-08-19
> 关联文档：[架构优化方案-v3](架构优化方案-v3.md)；[CLI项目上下文与路径解析引擎封装方案](CLI项目上下文与路径解析引擎封装方案.md)；[CLI基础设施闭环方案](../archive/2026/CLI基础设施闭环方案.md)；[registry产物发布时构建方案](../archive/2026/registry产物发布时构建方案.md)
> 修订记录：
> - 2026-08-19：初稿定稿。确立 `RegistryCompiler` 深模块编译流水线、`SourceProvider` 双适配器 Seam（Disk/Memory）、AST 语义安全重写、增量缓存策略与发射器（Emitters）解耦架构。
> - 2026-08-19（v2）：基于第一性原理完成全面审查与修复。深度融合 CLI 级 `FileSystemAdapter`（Disk/Memory VFS Seam），统合读取与发射端 IO 抽象；明确 AST 精确字符切片替换策略（保证 Vue SFC 源码与注释 100% 保真）；厘清 Data Emitter 与 IO Emitter 的纯度边界；全面精化 TypeScript 强类型定义；确立跨平台 POSIX 路径归一化不变量与平滑过渡门禁。

---

## 一、 背景与第一性原理

### 1. 现状痛点分析

在 BrutxUI Vue 3 中，`packages/registry` 是连接核心 UI 组件库（`packages/ui`）与分发 CLI（`packages/cli`）的关键构建枢纽。它负责将源码静态解析、重写路径别名、抽取依赖闭包并打包为符合 `shadcn` 规范的注册表 JSON。

当前 `packages/registry/scripts/build-registry.ts` 呈现出严重的**超大单体脚本（Monolithic Script）**与**浅层泄漏（Interface Leakage）**问题：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       当前 build-registry.ts 架构现状 (1412 行单体)          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 8 种正交职责挤压在单个过程式脚本中                                        │
│    ├─ Manifest/Metadata 聚合读取 (loadMergedRegistry)                       │
│    ├─ AST 源码分析与路径别名重写 (rewriteImports, extractDeps...)            │
│    ├─ 传递依赖闭包深度遍历 (buildRegistryItem, processComposables...)       │
│    ├─ 多级哈希计算与增量缓存读写 (computeSourceHash, loadCache, saveCache)  │
│    ├─ CycloneDX 1.5 SBOM 供应链生成 (buildRegistrySbom, serialNumber)       │
│    ├─ 注册表 Manifest 生成与 Ed25519 签名 (signManifestFromEnv)             │
│    ├─ 物理文件系统写盘与过期文件清理 (removeStaleRegistryFiles)             │
│    ├─ 性能基准采样统计 (--bench, bench.json)                                │
│    └─ 文件系统监听与防抖热重载循环 (runWatch, FSWatcher)                     │
│                                                                             │
│ 2. 正则表达式替换造成语义脆弱性 (Semantic Fragility)                         │
│    ├─ rewriteImports 混用全局正则匹配与 <script> 截取                       │
│    └─ 无法精准区分行内注释、多行字符串、动态 import() 与同名子目录别名      │
│                                                                             │
│ 3. 强绑定物理文件系统与全局顶层副作用 (测试脆断与高 IO 渗透)                 │
│    ├─ 模块顶层直接执行 loadMergedRegistry() 读盘，文件未生成时 import 即抛错│
│    └─ 单元测试无法脱离磁盘运行，难以隔离测试复杂的边缘语法与虚拟源码结构      │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **接口过宽与单体膨胀（Monolithic Complexity）**：
   单个文件达 1412 行，包含 25+ 个顶级函数与数十个模块内部私有状态，修改任何一个构建阶段（如调整 SBOM 结构或微调 watch 延时）都可能意外影响到 AST 重写或签名哈希。
2. **缺乏独立抽象的编译器 Seam（Missing Compiler Seam）**：
   没有清晰的 `RegistryCompiler` 实体，上层（如 CLI 入口、Watch 模式、单测）无法把注册表构建作为纯内存服务进行调用。
3. **AST 转换与正则替换混合（Semantic Fragility）**：
   `rewriteImports` 混用了正则全局匹配与 `<script>` 标签截取，在处理复杂的多行导入、注释内伪路径或同名子路径时存在隐蔽的误伤风险；同时若直接通过 AST Printer 重构又会丢失原始格式与注释。
4. **测试难以无 IO 隔离（Testability Friction）**：
   由于直接依赖 `fs.readFileSync` 和磁盘物理目录，单个组件编译测试无法以纯内存方式在微秒级内验证边缘 case。

---

### 2. 第一性原理推导

从编译原理与深模块设计准则出发：
- **编译器的本质**：`Compiler: (SourceAST, Metadata, Config) -> (CompiledRegistry, IntegrityHash)`。它应当是一个纯计算、确定性、无副作用的数据变换管道。
- **IO 与副作用属于外围边界**：物理写盘（`DiskEmitter`）、文件监听（`Watcher`）、基准统计（`BenchmarkTracker`）、CLI 命令编排属于外围 Shell，必须与纯计算的 Compiler Core 严格分离。
- **可复现性与幂等性（Deterministic & Idempotent）**：无论何时、在何种环境下构建，相同源码和配置必须产出逐字节相同的输出 JSON、哈希与 SBOM 序列。
- **双适配器 Seam（参考 CLI FileSystemAdapter 成熟体系）**：统合读取与发射两端的 IO 抽象，生产环境注入 `DiskFileSystemAdapter`，测试环境注入 `MemoryFileSystemAdapter`，实现全编译管线 100% 零 IO 内存沙箱化。
- **AST 定位 + 原文局部精准切片（Surgical AST Rewriting）**：只用 AST 识别并定位 Import/Export 节点中的 `StringLiteral` 字符偏移量，在原源码字符串上做切片替换，绝不重新打印 AST，确保源码格式、换行与注释 100% 保真。

---

## 二、 架构设计与核心契约

### 1. 架构分层蓝图

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Runner & CLI Layer                               │
│      packages/registry/scripts/build-registry.ts (薄入口，向后兼容 re-export)│
│      packages/registry/src/runner/build-runner.ts (CLI 编排与主流程调度)     │
│      packages/registry/src/runner/watcher.ts (Watch 模式防抖增量重编)        │
│      packages/registry/src/runner/benchmark-tracker.ts (性能基准采样统计)   │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
┌─────────────────────────────────────────┐  ┌────────────────────────────────┐
│             Compiler Core               │  │      Data & IO Emitters        │
│  RegistryCompiler (主编译器管道)        │  │  [Data Emitters (纯计算)]      │
│  ├─ AstRewriter (AST 切片语义安全重写)  │  │  ├─ SbomGenerator (CycloneDX) │
│  ├─ DependencyResolver (传递闭包解析)   │  │  └─ ManifestSigner (Ed25519)  │
│  └─ CacheManager (增量哈希计算与判定)   │  │  [IO Emitter (物理/虚拟落盘)]  │
│                                         │  │  └─ DiskEmitter (原子写盘/清理)│
└──────────────────────┬──────────────────┘  └────────────────┬───────────────┘
                       │                                      │
                       └──────────────────┬───────────────────┘
                                          │ (统一 VFS 抽象)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FileSystemAdapter (VFS Seam)                          │
│  DiskFileSystemAdapter (物理磁盘)    │  MemoryFileSystemAdapter (内存沙箱)   │
│  - 跨平台 POSIX 路径归一化           │  - 纯 Map 虚拟文件系统树              │
│  - Windows 盘符小写标准化            │  - 零 IO 毫秒级单测夹具               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. 核心接口与数据契约

#### (1) `FileSystemAdapter` 统一虚拟文件系统契约（对齐 CLI 模式）

```typescript
export interface FileEntry {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
}

export interface FileStat {
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
    mtimeMs: number;
    size: number;
}

export interface FsRemoveOptions {
    recursive?: boolean;
    force?: boolean;
}

export interface FileSystemAdapter {
    readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    writeFile(filePath: string, content: string | Uint8Array, encoding?: BufferEncoding): Promise<void>;
    readJson<T = unknown>(filePath: string): Promise<T>;
    writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void>;
    pathExists(filePath: string): Promise<boolean>;
    ensureDir(dirPath: string): Promise<void>;
    remove(targetPath: string, options?: FsRemoveOptions): Promise<void>;
    copy(src: string, dest: string): Promise<void>;
    stat(filePath: string): Promise<FileStat>;
    lstat?(filePath: string): Promise<FileStat>;

    readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;

    realpath(filePath: string): Promise<string>;
}
```

- **`DiskFileSystemAdapter`**：生产环境执行真实的 Node.js `fs-extra` / `node:fs/promises` 操作。
- **`MemoryFileSystemAdapter`**：测试专用，接收 `new MemoryFileSystemAdapter(initialFiles?: Record<string, string>)`，自动构建内存目录树，所有路径统一按 POSIX `/` 格式与 Windows 小写盘符归一化。

---

#### (2) 编译器核心契约：`RegistryCompiler`

```typescript
import type {
    ComponentMetadataEntry,
    MergedRegistryEntry,
    RegistryBuildManifest,
    RegistryFile,
    RegistryIndex,
    RegistryItem,
    RegistryManifest,
    RegistrySbom,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';

export interface CompilerPaths {
    componentsDir: string;
    composablesDir: string;
    localesDir: string;
    libDir: string;
    directivesDir: string;
    manifestPath: string;
    outputDir: string;
}

export interface CompilerOptions {
    fs?: FileSystemAdapter;
    paths?: Partial<CompilerPaths>;
    tailwindConfig?: Record<string, unknown>;
    cssVars?: Record<string, string>;
    libExclude?: Set<string>;
    manifestOverrides?: Record<string, Partial<Pick<MergedRegistryEntry, 'directives' | 'composables' | 'lib'>>>;
    metadata?: Record<string, ComponentMetadataEntry>;
    manifest?: RegistryManifest;
}

export interface CompiledItemResult {
    name: string;
    item: RegistryItem;
    sourceHash: string;
    cached: boolean;
    durationMs: number;
}

export interface CompiledRegistryResult {
    index: RegistryIndex;
    manifest: RegistryBuildManifest;
    sbom: RegistrySbom;
    items: Map<string, RegistryItem>;
    itemResults: CompiledItemResult[];
    cacheRecord: Record<string, string>;
    totalDurationMs: number;
}

export class RegistryCompiler {
    constructor(options?: CompilerOptions);

    /** 编译单个组件条目（纯内存计算，零物理 IO 副作用） */
    public async compileItem(name: string): Promise<CompiledItemResult>;

    /** 编译多语言基础包条目（locale-zh-cn） */
    public async compileLocaleZhCn(): Promise<CompiledItemResult>;

    /** 批量增量/全量编译整个注册表内存对象 */
    public async compileAll(options?: { forceRebuild?: boolean }): Promise<CompiledRegistryResult>;
}
```

---

### 3. 子模块与流水线阶段设计

#### (1) AST 切片语义安全重写（`AstRewriter`）
- **核心准则**：严禁正则盲目全局替换，也严禁 `ts.createPrinter` 重排代码。
- **切片替换算法**：
  1. 使用 TypeScript Compiler API 解析 `<script>` 块，遍历识别 `ImportDeclaration`、`ExportDeclaration`、动态 `import()` 节点；
  2. 获取 `node.moduleSpecifier` 字符起止索引 `[start, end]`；
  3. 根据当前上下文（`component`、`composable`、`lib`、`directive`、`locale`）精确计算目标别名（如 `@/components/ui/button/Button.vue`、`@/composables/useLocale`、`@/lib/utils`）；
  4. 对原始字符串执行局部切片替换（按倒序替换偏移量），完全保留原始注释、缩进、换行与 TypeScript/Vue SFC 模板。

#### (2) 依赖解析与传递闭包（`DependencyResolver`）
- 基于 AST 静态提取组件引用的内部子组件、`composables`、`locales`、`lib`、`directives`；
- 递归收集并平铺所有传递依赖源文件；
- 动态合成派生 barrel（`index.ts`），并对未注册的第三方引用与组件循环依赖进行静态断言。

#### (3) 增量缓存管理器（`CacheManager`）
- 依据 `CACHE_VERSION` + 组件元数据 + 传递闭包内所有源码原文 + 共享 Tokens/CSS 变量 + 派生 barrel 原文，求取确定性 SHA-256 `sourceHash`；
- 在内存与持久化介质中提供高效缓存命中判定与失效回退机制。

#### (4) 数据发射器与 IO 发射器（`Emitters`）
- **Data Emitters（纯计算）**：
  - `SbomGenerator`：生成 CycloneDX 1.5 格式 SBOM，纯函数计算确定性 `serialNumber` 与 `integrity`；
  - `ManifestSigner`：纯函数接收 manifest 与密钥配置，签发 Ed25519 `signature` 与 `keyId`。
- **IO Emitter（写盘与维护）**：
  - `DiskEmitter`：接收 `FileSystemAdapter` 与 `CompiledRegistryResult`，原子化落盘所有组件 JSON、`index.json`、`registry-manifest.json`、`registry-sbom.json`，并扫描清理已废弃的历史产物。

---

## 三、 模块化拆解与目录规划

```text
packages/registry/
├── src/
│   ├── fs/                           # 统一 VFS 抽象（对齐 CLI 设计）
│   │   ├── file-system-adapter.ts    # FileSystemAdapter 接口及类型契约
│   │   ├── disk-fs.ts                # 基于 Node.js fs-extra 的生产磁盘适配器
│   │   └── memory-fs.ts              # 零 IO 内存虚拟文件系统（单测沙箱）
│   ├── compiler/                     # 纯内存编译器核心
│   │   ├── types.ts                  # 编译器配置、上下文与结果强类型定义
│   │   ├── ast-rewriter.ts           # AST 定位 + 原文切片精准重写纯函数
│   │   ├── dependency-resolver.ts    # 传递闭包依赖递归解析器
│   │   ├── cache-manager.ts          # 增量哈希计算与缓存控制器
│   │   └── registry-compiler.ts      # 主编译器核心类
│   ├── emitters/                     # 产物生成与输出
│   │   ├── sbom-generator.ts         # [Data] CycloneDX 1.5 SBOM 确定性生成器
│   │   ├── manifest-signer.ts        # [Data] Ed25519 签名与校验服务
│   │   └── disk-emitter.ts           # [IO] 编译结果原子写盘与过时文件清理
│   ├── runner/                       # CLI 运行时编排
│   │   ├── benchmark-tracker.ts      # --bench 耗时与性能报告收集器
│   │   ├── watcher.ts                # Watch 模式防抖增量重编调度器
│   │   └── build-runner.ts           # CLI 编排执行器 (整合编译、写盘、基准)
│   └── index.ts                      # 统一公共导出
├── scripts/
│   ├── build-registry.ts             # CLI 薄入口 (转发执行 + 兼容既有 re-export)
│   ├── validate-registry.ts          # 注册表校验入口
│   ├── validate-utils.ts             # 校验工具函数库
│   └── verify-build.ts               # 构建产物完整性验证脚本
└── tests/
    ├── fs/
    │   └── memory-fs.test.ts         # VFS 内存文件系统行为单测
    ├── compiler/
    │   ├── ast-rewriter.test.ts      # AST 切片重写与边缘语法专项单测
    │   ├── dependency-resolver.test.ts# 闭包依赖解析单测
    │   ├── cache-manager.test.ts     # 增量哈希与失效机制单测
    │   └── registry-compiler.test.ts # 基于 MemoryFileSystemAdapter 的零 IO 深度单测
    ├── emitters/
    │   ├── sbom-generator.test.ts    # SBOM 确定性生成单测
    │   └── manifest-signer.test.ts   # Ed25519 签名单测
    ├── build-registry.test.ts        # 既有端到端测试与兼容性回归
    └── watch-mode.test.ts            # Watch 模式单测
```

---

## 四、 实施计划

### 阶段一：VFS 抽象与基础契约就绪（P0）
- 更新 `packages/registry/tsconfig.json` 的 `include` 包含 `src/**/*`。
- 实现 `src/fs/file-system-adapter.ts`、`src/fs/disk-fs.ts`、`src/fs/memory-fs.ts`，打通 POSIX 路径与 Windows 盘符归一化。
- 实现 `src/compiler/types.ts` 定义全套强类型契约。

### 阶段二：AST 切片转换与依赖解析管线（P0）
- 实现 `src/compiler/ast-rewriter.ts`，基于 TypeScript AST 定位 + 局部精确切片替换重写 import 别名。
- 实现 `src/compiler/dependency-resolver.ts`，完成传递闭包递归发现与派生 barrel 合成。
- 编写 `ast-rewriter.test.ts` 与 `dependency-resolver.test.ts` 专项单测。

### 阶段三：增量缓存与纯内存编译器核心（P0）
- 实现 `src/compiler/cache-manager.ts`，封装 `sourceHash` 计算与多层失效判定。
- 实现 `src/compiler/registry-compiler.ts`，组装纯内存编译主管道。
- 编写 `registry-compiler.test.ts`，使用 `MemoryFileSystemAdapter` 进行全流程零 IO 深度单测。

### 阶段四：产物发射器解耦（P1）
- 实现 `src/emitters/sbom-generator.ts`，纯计算派生 CycloneDX 1.5 数据与序列号。
- 实现 `src/emitters/manifest-signer.ts`，纯计算签发 Ed25519 签名。
- 实现 `src/emitters/disk-emitter.ts`，通过 `FileSystemAdapter` 完成原子落盘与清理。

### 阶段五：运行时调度与薄入口兼容（P1）
- 实现 `src/runner/benchmark-tracker.ts`、`src/runner/watcher.ts` 与 `src/runner/build-runner.ts`。
- 重构 `scripts/build-registry.ts` 为薄入口，中继调用 `build-runner.ts`，并保留关键函数的对外 re-export 确保对既有脚本和测试零破坏。
- 完善 `src/index.ts` 统一导出。

### 阶段六：全量验证与质量门禁（P0）
- 运行 `pnpm test`、`pnpm build`、`pnpm validate`、`pnpm bench`、`pnpm typecheck`。
- 对比重构前后的 `registry/*.json` 产物哈希，确保 100% 字节级一致。

---

## 五、 质量门禁与验收标准

1. **产物绝对幂等性（Byte-for-Byte Determinism）**：
   重构后编译生成的全部 `registry/*.json`、`registry-manifest.json` 与 `registry-sbom.json` 必须与重构前内容逐字节自洽，哈希完全匹配。
2. **零 IO 内存测试能力（Zero-IO Testability）**：
   `RegistryCompiler` 与 `AstRewriter` 的核心测试完全基于 `MemoryFileSystemAdapter` 运行，脱离物理磁盘，单测套件在毫秒级执行完毕。
3. **类型安全与规范**：
   `pnpm --filter brutx-registry-vue typecheck` 0 错误，严格开启 TypeScript strict 模式，严禁使用隐式 `any` 或宽泛未约束类型。
4. **验证命令集**：
   ```bash
   pnpm --filter brutx-registry-vue test
   pnpm --filter brutx-registry-vue build
   pnpm --filter brutx-registry-vue validate
   pnpm --filter brutx-registry-vue bench
   pnpm --filter brutx-registry-vue typecheck
   pnpm --filter brutx-registry-vue lint
   ```
