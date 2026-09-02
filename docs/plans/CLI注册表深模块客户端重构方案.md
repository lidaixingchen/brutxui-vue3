# CLI注册表深模块客户端重构方案

> 方案类型：重构 / 架构优化
> 状态：**active**
> 日期：2026-09-02
> 关联文档：[架构优化方案-v3](架构优化方案-v3.md)
> 修订记录：完善网络层 Ports & Adapters 抽象、统一组件说明符与版本规范、规范组件列表枚举协议、明确生命周期与公共 API 终态规范

---

## 一、 背景与现状分析

### 1. 现状痛点

在当前 `packages/cli` 架构中，Registry 相关逻辑呈现出典型的**上帝模块（God Module）**与**浅包装集群（Shallow Module Cluster）**特征：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       当前 Registry 模块群与调用现状                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. packages/cli/src/lib/registry.ts (750+ 行上帝模块)                       │
│    ├─ 混杂本地 components.json 校验与迁移（readConfig / migrateConfig）      │
│    ├─ 混杂 Ed25519 签名验证、Manifest 交叉校验与完整性判定                  │
│    ├─ 混杂 HTTP 条件请求（304 协商）与缓存读写调度                           │
│    ├─ 混杂 DAG 拓扑递归排序与循环依赖检测                                   │
│    └─ 混杂本地 Registry 目录枚举与路径穿越防护                              │
│                                                                             │
│ 2. 周边浅包装模块与全局可变状态（耦合严重、测试污染）                       │
│    ├─ cache.ts：仅对 storage/cache-storage.ts 的薄包装导出                   │
│    ├─ signature-mode.ts：维护 globalRequireSignature 全局变量，非并发安全     │
│    ├─ signature.ts：维护 trustedPublicKeysOverride 全局变量                  │
│    └─ registry-source.ts：依赖 withOfflineScope 动态劫持 process.env         │
│                                                                             │
│ 3. 抽象不彻底与 I/O 隔离缺失（Lack of Isolation）                            │
│    ├─ 仅抽象了文件系统适配器，网络 I/O 隐式直连全局 fetch，无法纯内存单测     │
│    ├─ 组件版本标识符（@version）解析深陷在 resolveDeps 内部，fetchItem 不可用 │
│    └─ listLocal 破坏客户端抽象对称性，属于实现细节泄漏                      │
│                                                                             │
│ 4. 上层调用方认知负担重（Lack of Leverage）                                │
│    └─ add / diff / info / update 必须手动组装多源 fallback、npm 依赖去重、   │
│       签名开关与缓存策略，未能形成极简的高内聚深 Seam                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **全局可变状态导致测试并发污染**：
   公钥覆盖（`trustedPublicKeysOverride`）、严格签名开关（`globalRequireSignature`）以及离线模式（`withOfflineScope` 临时写入 `process.env.BRUTX_OFFLINE`）均为模块级全局状态，在多用例并发测试时极易发生状态覆盖与竞态漂移。
2. **浅模块层级冗余，违反 Deletion Test 原则**：
   `cache.ts` 仅作为 `CacheStorage` 的函数转发层；`signature-mode.ts` 仅维护一个布尔值单例。这些薄文件增加了代码认知负荷，未提供实质性的领域抽象。
3. **领域职责混杂（Domain Coupling）**：
   `registry.ts` 既处理网络协议与依赖 DAG，又承载了本地 `components.json` 的 schema 校验与迁移（`readConfig`, `migrateConfig`），违背单一职责原则。
4. **I/O 隔离不完整与抽象泄漏**：
   文件系统虽有适配器，但网络层隐式依赖底层 `resilientFetch`，测试远程注册表特性时无法脱离全局 mock；`listLocal` 将本地目录特异性暴露为公开 API，破坏了注册表源的统一多态抽象。
5. **依赖解析输出低阶，上层手写胶水代码**：
   `resolveDeps` 仅输出扁平条目并通过 `outSources?: Map<string, string>` 传出命中源，导致 `commands/add.ts` 与 `add-service.ts` 需自建 `resolveComponents` 手动提取去重 npm `dependencies` 与 `devDependencies`。

---

## 二、 架构设计与核心契约

### 1. RegistryClient 深模块设计

构造单一、高内聚、基于类的深模块 `RegistryClient`，以**依赖注入（Dependency Injection）**替代全局状态，以**端口与适配器（Ports & Adapters）**完全隔离真实文件系统与网络 I/O：

```text
                               ┌────────────────────────┐
                               │   Callers / Services   │
                               │ (Add, Diff, Info, ...) │
                               └───────────┬────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │          RegistryClient             │
                        │     (Single Deep Seam API)          │
                        │  - fetchItem(specifier)             │
                        │  - resolveDependencies(specifiers)  │
                        │  - listComponents(options)          │
                        └──────────────────┬──────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            │                              │                              │
 ┌──────────▼──────────┐        ┌──────────▼──────────┐        ┌──────────▼──────────┐
 │ DAG Sorter Pipeline │        │ Security & Signature│        │  Storage & Network  │
 │  - Specifier Normal.│        │  - Ed25519 Verify   │        │  - 304 Conditional  │
 │  - DFS DAG Resolve  │        │  - Manifest Cross   │        │  - Hedged Race      │
 │  - Cycle Detection  │        │  - Integrity Check  │        │  - HttpFetcher Port │
 │  - Npm Deps Aggreg. │        │  - Manifest Cache   │        │  - CacheStorage     │
 └─────────────────────┘        └─────────────────────┘        └─────────────────────┘
                                                                          │
                                                      ┌───────────────────┴───────────────────┐
                                                      ▼                                       ▼
                                            [Production Adapters]                    [Testing Adapters]
                                            - DiskFileSystemAdapter                  - MemoryFileSystemAdapter
                                            - resilientFetch                         - In-Memory Mock Fetcher
```

### 2. 构造配置契约：`RegistryClientOptions`

```typescript
export type HttpFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface RegistryClientOptions {
    /** 注册表源列表（URL 或本地目录绝对路径，按优先级排列） */
    readonly sources?: readonly string[];
    /** 是否强制要求 Ed25519 签名验证（严格模式下验签失败抛错） */
    readonly requireSignature?: boolean;
    /** 受信任公钥列表（覆盖默认官方公钥与环境变量） */
    readonly trustedPublicKeys?: readonly TrustedPublicKey[];
    /** 是否处于离线模式（仅读取缓存与本地源，不发起网络请求） */
    readonly offline?: boolean;
    /** 是否启用缓存（设为 false 时绕过读取并跳过写入） */
    readonly useCache?: boolean;
    /** 缓存存储适配器（支持注入内存或自定义缓存实现） */
    readonly cacheStorage?: CacheStorage;
    /** 文件系统适配器（用于本地注册表与缓存 IO） */
    readonly fsAdapter?: FileSystemAdapter;
    /** HTTP 请求适配器（实现网络层 Ports & Adapters，注入后可实现 100% 纯内存沙箱测试） */
    readonly httpFetcher?: HttpFetcher;
    /** 多源自适应竞速追踪器（用于网络健康度记忆） */
    readonly tracker?: RegistrySourceTracker;
}
```

### 3. 公开 Seam 接口定义

`RegistryClient` 对外暴露 3 个高度内聚的核心方法，内部隐藏全部网络重试、签名比对、缓存协商、多源竞速与拓扑调度细节：

```typescript
export interface ResolvedDependenciesResult {
    /** 拓扑排序完成的组件条目列表（已通过完整性校验与签名背书，安装顺序安全） */
    readonly items: readonly RegistryItem[];
    /** 各组件实际命中的注册表源 URL / 路径（支持多源回退与 CDN 溯源） */
    readonly hitSources: ReadonlyMap<string, string>;
    /** 所有组件递归收集并去重后的生产 npm 依赖列表 */
    readonly dependencies: readonly string[];
    /** 所有组件递归收集并去重后的开发 npm 依赖列表 */
    readonly devDependencies: readonly string[];
}

export interface FetchItemOptions {
    /** 可选指定覆盖源（如未指定则按 client 配置的多源阶梯竞速拉取） */
    readonly sourceOverride?: string;
    /** 请求级 AbortSignal */
    readonly signal?: AbortSignal;
}

export interface ListComponentsOptions {
    /** 可选指定枚举的目标源（若未指定则使用 client 配置的主源） */
    readonly source?: string;
    /** 请求级 AbortSignal */
    readonly signal?: AbortSignal;
}

export class RegistryClient {
    public constructor(options?: RegistryClientOptions);

    /**
     * 获取单个组件的完整定义。
     * 支持组件名或带版本说明符（如 "button" 或 "button@v1"）。
     * 自动处理：说明符归一化、阶梯竞速、HTTP 304 缓存协商、Ed25519 签名校验、Manifest 交叉校验与完整性断言。
     */
    public fetchItem(specifier: string, options?: FetchItemOptions): Promise<RegistryItem>;

    /**
     * 递归解析指定组件说明符列表的完整依赖图（DAG）。
     * 自动处理：说明符解析、循环依赖检测、拓扑排序、去重以及生产/开发 npm 依赖一站式聚合。
     */
    public resolveDependencies(
        specifiers: readonly string[],
        options?: FetchItemOptions,
    ): Promise<ResolvedDependenciesResult>;

    /**
     * 枚举指定注册表源中所有可用的组件名称（排序后返回）。
     * - 本地文件源：扫描目录并过滤非组件与元数据文件；
     * - 远程源：若目标源不支持清单枚举，抛出强类型错误 REGISTRY_LIST_UNSUPPORTED。
     */
    public listComponents(options?: ListComponentsOptions): Promise<readonly string[]>;
}
```

---

## 三、 领域边界划分与模块收敛

### 1. 本地配置职责剥离

将 `components.json` 相关解析与迁移逻辑从 Registry 领域彻底剥离，归入 `ProjectContext` 与独立的 `lib/config.ts`：

- **剥离函数**：`readConfig`、`readConfigSafe`、`validateBrutalistConfig`、`migrateConfig`。
- **职责划分**：`ProjectContext` 负责读取项目 `components.json`，并将 `registries`、`requireSignature`、`trustedPublicKeys` 等字段转化为纯粹的 `RegistryClientOptions` 注入给 `RegistryClient`。

### 2. 浅模块删除与服务层收拢

根据 0.x 快速演进原则，坚决清理无价值包装层：

| 文件 / 模块 | 处理策略 | 说明 |
| --- | --- | --- |
| `packages/cli/src/lib/cache.ts` | **删除** | 外部若需要底层存储直接使用 `CacheStorage`；Registry 内部缓存与 inflight 去重完全由 `RegistryClient` 私有管理。 |
| `packages/cli/src/lib/signature-mode.ts` | **删除** | 废除 `globalRequireSignature` 模块全局变量，严格模式状态作为 `RegistryClient` 实例只读属性。 |
| `packages/cli/src/lib/signature.ts` | **收拢** | 废除 `trustedPublicKeysOverride` 全局变量，保留纯函数算法（`verifyManifestIntegrityAndSignature`、`generateEd25519KeyPair`）作为内部组件。 |
| `packages/cli/src/lib/registry-source.ts` | **收敛** | 废除 `withOfflineScope` 对 `process.env` 的动态劫持，多源阶梯竞速与认证注入作为 `RegistryClient` 私有流水线。 |
| `packages/cli/src/lib/registry.ts` | **重写** | 转换为 `RegistryClient` 类实现文件。 |
| `packages/cli/src/lib/services/add-service.ts` | **简化** | 废除过时的浅包装函数 `resolveComponents`，上层直接通过 `RegistryClient.resolveDependencies` 获取高杠杆结果。 |
| `packages/cli/src/api.ts` | **导出演进** | 直接将 `RegistryClient` 及结果类型导出为公共 API 的一等公民，清理无意义的历史胶水。 |

---

## 四、 错误模型与类型守卫体系

统一收敛 Registry 领域的所有错误码，并在 `RegistryClient` 中导出强类型守卫，避免上层调用方编写脆弱的字符串比对：

```typescript
export const REGISTRY_ERROR_CODES = [
    'REGISTRY_FETCH_FAILED',
    'COMPONENT_NOT_FOUND',
    'REGISTRY_INTEGRITY_FAILED',
    'REGISTRY_SIGNATURE_INVALID',
    'PATH_UNSAFE',
    'REGISTRY_OFFLINE_UNAVAILABLE',
    'REGISTRY_VERSION_UNSUPPORTED',
    'INVALID_REGISTRY',
    'REGISTRY_LIST_UNSUPPORTED',
] as const;

export type RegistryErrorCode = (typeof REGISTRY_ERROR_CODES)[number];

/** 判定是否为“组件在注册表中不存在”（404 或本地文件缺失）的精准守卫 */
export function isComponentNotFoundError(error: unknown): boolean;

/** 判定是否为安全类错误（签名无效、完整性篡改、路径穿越） */
export function isRegistrySecurityError(error: unknown): boolean;

/** 判定是否为离线不可用错误 */
export function isRegistryOfflineError(error: unknown): boolean;

/** 判定是否为注册表源不支持枚举操作的错误 */
export function isRegistryListUnsupportedError(error: unknown): boolean;
```

---

## 五、 调用方与服务层集成

### 1. `ProjectContext` 聚合根与生命周期管理

为了保证 Manifest 内存缓存与 inflight 请求去重在同一操作周期内高效复用，同时杜绝全局变量污染，`ProjectContext` 采用**惰性单例（Lazy Singleton）**持有默认客户端，并保留显式工厂方法供自定义场景使用：

```typescript
export class ProjectContext {
    private _registryClient?: RegistryClient;

    /**
     * 获取项目级默认 RegistryClient 实例（惰性单例）。
     * 自动绑定当前项目配置、VFS 适配器及离线模式，共享 Manifest 内存缓存与请求去重。
     */
    public get registry(): RegistryClient {
        if (!this._registryClient) {
            this._registryClient = this.createRegistryClient();
        }
        return this._registryClient;
    }

    /**
     * 创建具备指定重载配置的独立 RegistryClient 实例（用于特定隔离沙箱或覆盖测试）。
     */
    public createRegistryClient(overrides?: Partial<RegistryClientOptions>): RegistryClient {
        const config = this.config;
        return new RegistryClient({
            sources: resolveRegistrySources(config, overrides?.sources?.[0]),
            requireSignature: overrides?.requireSignature ?? config?.requireSignature,
            trustedPublicKeys: overrides?.trustedPublicKeys ?? config?.trustedPublicKeys,
            offline: overrides?.offline ?? isOfflineMode(),
            fsAdapter: this.fs,
            ...overrides,
        });
    }
}
```

### 2. 上层命令/服务改造成果对比

| 调用场景 | 改造前（分散浅调用） | 改造后（深 Seam 极简调用） |
| --- | --- | --- |
| **`add` 命令依赖解析** | 手动调用 `resolveRegistrySources`、`withOfflineScope`、`resolveDeps`、`resolveComponents`（30+ 行） | `const res = await context.registry.resolveDependencies(components);`（1 行直出 items、hitSources 与去重 deps） |
| **`diff` 组件拉取** | 手动处理 304、多源 fallback 与 `registry-unreachable` 异常转换 | `const item = await context.registry.fetchItem(name);` + 类型守卫分流 |
| **`info` 详情查看** | 手动解析多源并 try-catch 判断 404 降级 | `const item = await context.registry.fetchItem(name);` + `isComponentNotFoundError(err)` |
| **`add --all` 扫描** | 调用独立的 `listLocalRegistryComponents(path, fs)` | `const names = await context.registry.listComponents();` |

---

## 六、 可测试性与沙箱隔离

重构后的 `RegistryClient` 具备**真正的 100% 内存沙箱隔离能力**，同时支持文件与网络的全链路虚拟化，测试并发零冲突：

```typescript
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { CacheStorage } from './storage/cache-storage.js';
import { RegistryClient, type HttpFetcher } from './registry.js';

// 纯内存文件系统与缓存
const memoryFs = new MemoryFileSystemAdapter();
const memoryCache = new CacheStorage({ fs: memoryFs, cacheDir: '/cache' });

// 纯内存 Mock HTTP 适配器（无任何全局 vi.mock 或网络 socket）
const mockFetcher: HttpFetcher = async (url) => {
    if (url.endsWith('button.json')) {
        return new Response(JSON.stringify({ name: 'button', files: [] }), { status: 200 });
    }
    return new Response(null, { status: 404 });
};

const client = new RegistryClient({
    sources: ['https://registry.example.com'],
    fsAdapter: memoryFs,
    cacheStorage: memoryCache,
    httpFetcher: mockFetcher,
    requireSignature: false,
});

// 并发测试任意互不干扰的 client 实例
const result = await client.resolveDependencies(['button']);
expect(result.items).toHaveLength(1);
```

---

## 七、 实施步骤与验证计划

1. **第一阶段：模型与配置解耦**
   - 将 `readConfig`、`migrateConfig`、`validateBrutalistConfig` 迁移至 `ProjectContext` 与 `config.ts`。
   - 定义 `RegistryClientOptions`、`ResolvedDependenciesResult`、`HttpFetcher` 及 `RegistryErrorCode` 契约。
2. **第二阶段：实现 `RegistryClient` 深模块**
   - 封装说明符规范化、Ed25519 验签、Manifest 交叉校验、304 缓存协商、多源竞速与 DAG 排序。
   - 实现实例内部的 Manifest 内存缓存与 inflight 请求去重。
   - 彻底删除 `cache.ts` 与 `signature-mode.ts`。
3. **第三阶段：上层 Callers 与 Service 接入**
   - 在 `ProjectContext` 中提供惰性 `registry` 属性与 `createRegistryClient` 工厂。
   - 重构 `add`、`diff-service`、`info.ts`、`update.ts` 接入全新 Seam。
   - 废除 `add-service.ts` 中的 `resolveComponents`，并在 `api.ts` 中直接暴露 `RegistryClient`。
4. **第四阶段：测试迁移与质量门禁**
   - 迁移原有 `registry.test.ts`、`signature.test.ts`、`cache.test.ts` 为针对 `RegistryClient` 的纯沙箱单测（使用 `MemoryFileSystemAdapter` 与 `mockFetcher`）。
   - 执行相关包测试 `pnpm --filter brutx-vue test` 与类型检查 `pnpm --filter brutx-vue typecheck`。
