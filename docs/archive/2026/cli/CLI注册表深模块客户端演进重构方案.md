---
方案类型: 重构 / 架构优化
状态: archived
日期: 2026-09-10
完工日期: 2026-09-10
关联文档:
  - ../../guides/DOC_GOVERNANCE.md
修订记录:
  - 2026-09-10: 完善深模块契约设计，增补 HttpFetcher 端口抽象、树级并发调度、ProjectContext 装配门面与原子测试替换路径
---

# CLI注册表深模块客户端演进重构方案

---

## 一、 背景与架构摩擦点分析

### 1. 现状痛点

在当前 `packages/cli` 架构中，注册表（Registry）相关模块呈现出典型的**上帝模块（God Module）**与**浅包装集群（Shallow Module Cluster）**特征：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       当前 Registry 模块群与调用现状                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. packages/cli/src/lib/registry.ts (上帝模块)                              │
│    ├─ 混杂本地 components.json 校验与迁移 (readConfig / migrateConfig)      │
│    ├─ 混杂 Ed25519 签名验证、Manifest 交叉校验与完整性判定                  │
│    ├─ 混杂 HTTP 条件请求 (304 协商) 与缓存读写调度                           │
│    ├─ 混杂 DAG 拓扑递归排序与循环依赖检测                                   │
│    └─ 混杂本地 Registry 目录枚举与路径穿越防护                              │
│                                                                             │
│ 2. 周边浅包装模块与全局可变状态（耦合严重、测试污染）                       │
│    ├─ cache.ts：仅作为 storage/cache-storage.ts 的函数转发层                 │
│    ├─ signature-mode.ts：维护 globalRequireSignature 全局变量，非并发安全     │
│    ├─ signature.ts：维护 trustedPublicKeysOverride 全局变量                  │
│    └─ registry-source.ts：依赖 withOfflineScope 动态修改 process.env         │
│                                                                             │
│ 3. 上层调用方认知负担重 (Lack of Leverage) 与瀑布流性能问题                 │
│    ├─ add / diff / info / update 必须手动编排多源回退与 npm 依赖去重         │
│    └─ 串行 DFS 网络瀑布流导致多组件解析拉取缓慢                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **全局可变状态导致测试并发污染**：
   公钥覆盖（`trustedPublicKeysOverride`）、严格签名开关（`globalRequireSignature`）以及离线模式（`withOfflineScope` 临时写入 `process.env.BRUTX_OFFLINE`）均为模块级全局状态，在并发测试时容易引发状态覆盖与竞态漂移。
2. **浅模块层级冗余，违反 Deletion Test 原则**：
   `cache.ts` 仅作为 `CacheStorage` 的函数转发层；`signature-mode.ts` 仅维护一个布尔值单例。这些薄文件增加了代码认知负荷，未提供实质性的领域抽象，删除后系统复杂度不会增加。
3. **领域职责混杂（Domain Coupling）**：
   `registry.ts` 既处理网络协议与依赖 DAG，又承载了本地 `components.json` 的 schema 校验与迁移（`readConfig`, `migrateConfig`），混淆了外部资产拉取与本地工程配置两个正交领域。
4. **依赖解析输出低阶，上层手写胶水代码**：
   原 `resolveDeps` 仅输出扁平条目并通过 `outSources?: Map<string, string>` 传出命中源，导致 `commands/add.ts` 与 `add-service.ts` 需手写胶水逻辑提取去重 npm `dependencies` 与 `devDependencies`。
5. **串行 DFS 导致拉取网络瀑布流**：
   多依赖遍历采用串行等待，未利用内部单飞去重机制实现同级依赖的并发拉取。

---

## 二、 架构设计与核心契约

### 1. RegistryClient 深模块设计

构造高内聚、深实现的 `RegistryClient` 类，将多源网络拉取、多源阶梯竞速、Ed25519 验签、HTTP 304 缓存协商、树级并发 DFS 与 DAG 拓扑排序全部封装在小接口之后：

```text
+-------------------------------------------------------------------------+
|                  Small Interface (RegistryClient)                       |
|   resolve(specifiers, options) -> Promise<ResolvedComponentPlan>       |
|   fetchItem(specifier, options) -> Promise<RegistryItem>                |
|   listComponents(options?)     -> Promise<readonly string[]>            |
|   getManifestSummary(source?)  -> Promise<RegistryManifestSummary | null> |
+-------------------------------------------------------------------------+
|                                                                         |
|                          Deep Implementation                            |
|   ┌───────────────────────────┐      ┌───────────────────────────────┐  |
|   │ Concurrent DFS DAG Sorter │      │ Ed25519 & SHA-256 Verifier    │  |
|   │ (Cycle Detection & Topo)  │      │ (Manifest Cross-Check & Sign) │  |
|   └───────────────────────────┘      └───────────────────────────────┘  |
|   ┌───────────────────────────┐      ┌───────────────────────────────┐  |
|   │ Multi-Source Hedged Race  │      │ Atomic Cache Storage Adapter  │  |
|   │ (Health Tracker & 304)    │      │ (Inflight Dedupe & TTL)       │  |
|   └───────────────────────────┘      └───────────────────────────────┘  |
+-------------------------------------------------------------------------+
                                     │ Ports & Adapters (Seams)
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
FileSystemAdapter              HttpFetcher                     CacheStorage
(DiskFS / MemoryFS)       (resilientFetch / Mock)            (Disk / Memory)
```

### 2. 接口契约定义

```typescript
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { RegistryItem, RegistryManifestSummary, TrustedPublicKey } from './types.js';
import type { CacheStorage } from './storage/cache-storage.js';
import type { RegistrySourceTracker } from './resilience/source-tracker.js';

export type HttpFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface RegistryClientOptions {
    /** 注册表源列表（优先级按序回退） */
    readonly sources?: readonly string[];
    /** 是否强制要求 Ed25519 签名验证（严格模式） */
    readonly requireSignature?: boolean;
    /** 受信任的公钥列表（覆盖默认官方 Root 密钥） */
    readonly trustedPublicKeys?: readonly TrustedPublicKey[];
    /** 是否处于离线模式（仅读缓存与本地源） */
    readonly offline?: boolean;
    /** 是否启用缓存 */
    readonly useCache?: boolean;
    /** 绑定的文件系统适配器（支持 MemoryFileSystemAdapter 纯内存测试） */
    readonly fsAdapter?: FileSystemAdapter;
    /** 显式注入的缓存存储实例 */
    readonly cacheStorage?: CacheStorage;
    /** HTTP 请求适配器（实现网络层 Ports & Adapters，注入后支持 100% 内存沙箱测试） */
    readonly httpFetcher?: HttpFetcher;
    /** 多源自适应竞速追踪器（用于网络健康度记忆） */
    readonly tracker?: RegistrySourceTracker;
}

export interface FetchItemOptions {
    /** 覆盖指定的注册表源 */
    readonly sourceOverride?: string;
    /** 请求级取消信号 */
    readonly signal?: AbortSignal;
    /** 请求级缓存控制覆盖 */
    readonly useCache?: boolean;
}

export interface ListComponentsOptions {
    /** 指定枚举的目标源（缺省使用主源） */
    readonly source?: string;
    /** 请求级取消信号 */
    readonly signal?: AbortSignal;
}

export interface ResolvedComponentPlan {
    /** 拓扑排序后的组件实体（依赖项在前，被依赖项在后，安装安全） */
    readonly items: readonly RegistryItem[];
    /** 组件名称到其实际命中源的映射（支持审计与 CDN 溯源） */
    readonly hitSources: ReadonlyMap<string, string>;
    /** 全量去重排序后的 npm 生产依赖 */
    readonly npmDependencies: readonly string[];
    /** 全量去重排序后的 npm 开发依赖 */
    readonly npmDevDependencies: readonly string[];
    /** 递归展开的所有内部组件依赖列表 */
    readonly registryDependencies: readonly string[];
}

export class RegistryClient {
    public constructor(options?: RegistryClientOptions);

    /**
     * 并发拓扑解析一组组件及其全部间接依赖，并提取去重依赖图谱
     */
    public resolve(
        specifiers: readonly string[],
        options?: FetchItemOptions
    ): Promise<ResolvedComponentPlan>;

    /**
     * 拉取单个组件元数据（带条件请求、304 缓存协商与完整性/签名交叉校验）
     */
    public fetchItem(
        specifier: string,
        options?: FetchItemOptions
    ): Promise<RegistryItem>;

    /**
     * 枚举可用组件名称（远程 Manifest 提取或本地目录扫描）
     */
    public listComponents(
        options?: ListComponentsOptions
    ): Promise<readonly string[]>;

    /**
     * 获取指定源的已签名清单摘要
     */
    public getManifestSummary(
        source?: string,
        signal?: AbortSignal
    ): Promise<RegistryManifestSummary | null>;
}
```

### 3. 错误模型与类型守卫契约

统一收敛错误码并提供类型守卫，杜绝上层基于字符串匹配处理异常：

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
```

---

## 三、 上下文装配与配置领域解耦

### 1. ProjectContext 作为单一装配源（Assembly Point）

为杜绝各命令层重复实例化与配置散落，由 `ProjectContext` 统一管理 `RegistryClient` 单例的组装与生命周期：

```typescript
export class ProjectContext {
    private _registryClient?: RegistryClient;

    /**
     * 获取当前上下文绑定的 RegistryClient 单例
     * 自动装配当前工程环境参数、缓存配置与源优先级
     */
    public getRegistryClient(overrides?: Partial<RegistryClientOptions>): RegistryClient {
        if (!this._registryClient || overrides) {
            const client = new RegistryClient({
                fsAdapter: this.fs,
                sources: this._config?.registry ? [this._config.registry] : undefined,
                ...overrides,
            });
            if (!overrides) {
                this._registryClient = client;
            }
            return client;
        }
        return this._registryClient;
    }
}
```

### 2. 配置管理彻底解耦归位

彻底切断注册表资产拉取与本地工程配置的耦合：
- 将 `readConfig`、`readConfigSafe` 与 `migrateConfig` 从 `registry.ts` 迁入 `packages/cli/src/lib/config.ts`。
- 本地 `components.json` 校验归属于 `ProjectContext` 领域，`RegistryClient` 仅作为纯净的网络/资产消费客户端，无任何本地配置副作用。

---

## 四、 树级并发解析机制

在 `RegistryClient.resolve` 内部，通过 `dedupeInflight` 请求去重表与 `Promise.all` 调度同级依赖，实现高效并发解析，杜绝网络瀑布：

```typescript
// 内部 DFS 调度机制
const dfs = async (specifier: string, parentSource?: string): Promise<void> => {
    // 1. 规范化说明符与环依赖检测
    // 2. 借助 dedupeInflight 并发拉取条目
    const { item, source: hitSource } = await this.dedupeInflight(cleanName, sourceKey, () => {
        return this.fetchWithSourcesPipeline(cleanName, effectiveSources, options);
    });

    // 3. 递归并发调度所有子组件依赖
    if (item.registryDependencies && item.registryDependencies.length > 0) {
        await Promise.all(
            item.registryDependencies.map(dep => dfs(dep, hitSource))
        );
    }

    // 4. 拓扑压栈与依赖去重归集
};
```

---

## 五、 演进与重构步骤

鉴于项目当前处于 0.x 开发早期，全面执行**原子破坏式重构**，不保留任何过渡兼容 shim。

### Phase 1: 完善 `RegistryClient` 实现与核心测试
1. 对齐 `packages/cli/src/lib/registry-client.ts` 与 `packages/cli/src/lib/registry-types.ts`，导出标准 `ResolvedComponentPlan`。
2. 实现 `resolve` 的树级并发调度，集成 `HttpFetcher`、`FileSystemAdapter` 完整测试注入能力。
3. 补全 `tests/registry-client.test.ts` 中的并发解析、环依赖防御与多源竞速用例。

### Phase 2: 配置管理迁移与 `ProjectContext` 装配
1. 将 `readConfig`、`readConfigSafe` 和 `migrateConfig` 正式迁入 `config.ts`，更新所有诊断与初始化模块的导入。
2. 在 `ProjectContext` 中提供 `getRegistryClient()` 懒加载装配方法，并支持测试注入。

### Phase 3: 调用方原子迁移与胶水代码删除
1. 重构 `add-service.ts`：以 `client.resolve()` 替换旧 `resolveDeps` 与自建胶水逻辑。
2. 重构 `diff-service.ts`、`remove-service.ts`、`commands/info.ts`、`commands/list.ts` 与 `commands/update.ts`：统一采用 `client.fetchItem()`、`client.listComponents()` 与 `client.resolve()`。
3. 重构 `diagnostics/engine.ts`：通过 `ProjectContext.getRegistryClient()` 执行完整性规则诊断。

### Phase 4: 测试策略替代（Replace, Don't Layer）与模块清理
1. 废除各命令测试（如 `add-service.test.ts`, `diff-service.test.ts`, `info.test.ts`）中针对 `registry.js` 的 `vi.mock()`。
2. 统一通过传入配置了 `MemoryFileSystemAdapter` 与 `mockFetcher` 的真实 `RegistryClient` 执行黑盒测试，以 Interface 为唯一测试表面。
3. 物理删除废弃模块：
   - `packages/cli/src/lib/registry.ts`
   - `packages/cli/src/lib/cache.ts`
   - `packages/cli/src/lib/signature-mode.ts`
4. 运行全包类型检查与测试门禁，验证干净终态。

---

## 六、 收益与验证指标

- **内聚性（Locality）**：网络传输、签名验证、缓存协调与依赖图计算完全收敛于 `RegistryClient` 单一模块。
- **高杠杆（Leverage）**：上层调用代码平均减少 35%~45%，无需关心多源 fallback、签名开关及 npm 依赖提取。
- **并发安全与可测性（Testability）**：消除所有全局可变状态污染，上层集成测试通过注入内存适配器直接运行，无任何脆弱的函数 mock。
- **性能吞吐（Throughput）**：树级并发拉取消除了串行网络瀑布流，复杂多依赖组件的拉取耗时显著降低。
