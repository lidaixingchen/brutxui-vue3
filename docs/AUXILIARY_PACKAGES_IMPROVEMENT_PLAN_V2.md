# 辅助包改进方案 v2

本文是 [v1 方案](./AUXILIARY_PACKAGES_IMPROVEMENT_PLAN.md) 的延续，而非替代。v1 的 P0/P1 大部分已落地，本文基于对三包源码的审计，提出新方向与深化方向。

## 现状基线（v1 已落地成果）

审计确认以下 v1 条目已实质完成，本文不再重复：

| v1 条目 | 落地证据 |
| --- | --- |
| Item 1 共享 schema | [registry.ts](../packages/shared/src/registry.ts) 已提供 `RegistryFile`/`RegistryItem`/`RegistryIndexItem`/`RegistryIndex` 类型 + `validateRegistryItem`/`validateRegistryIndex`/`computeRegistryIntegrity` 校验，含 `status`/`replacement`/`examples`/`category` 字段 |
| Item 2 registry 测试 | [tests/](../packages/registry/tests/) 已有 `build-registry.test.ts`、`validate-utils.test.ts` |
| Item 3 FileTransaction | [file-transaction.ts](../packages/cli/src/lib/file-transaction.ts) 已实现，[doctor.ts](../packages/cli/src/commands/doctor.ts) `applyFixes` 已接入事务回滚 |
| Item 4 错误 code | [error.ts](../packages/cli/src/lib/error.ts) 已有 7 个 `CliErrorCode` + `exitCode` + `cause`，[error-advice.ts](../packages/cli/src/lib/error-advice.ts) 提供按 code 的建议 |
| Item 6 依赖分析 | `es-module-lexer` 已是 CLI 依赖；[build-registry.ts](../packages/registry/scripts/build-registry.ts) 已调用 `validateRegistryItemInternalImports` + `findRegistryDependencyCycles` + `assertRegistryDependencyGraph` |
| Item 7 manifest | [manifest.ts](../packages/cli/src/lib/manifest.ts) 已生成 `.brutx/manifest.json`，记录 `integrity`/`files`/`registrySource`/`installedAt`/`dependencies`/`registryDependencies`/`status` |
| Item 9 registry manifest | `buildRegistryManifest` 已生成 `registry-manifest.json`，含 `registryVersion`/`buildTimestamp`/`gitCommit`/`itemCount`/items integrity map |
| Item 10 / 11 | 已完成（见 v1 文档标注） |

**额外发现**：[registry.ts](../packages/cli/src/lib/registry.ts) 的 `resolveDeps` 已支持隐藏的 `name@version` 语法（L232-245），会把 source 切换到对应 git tag/branch 的 raw URL。这是一个未文档化、未纳入 manifest 的版本能力，是本文 Item 3 的深化起点。

## 本文定位

v1 解决了"分发链路一致性"和"写入安全"。本文聚焦三个 v1 未覆盖的张力：

1. **安装后可观测性**：manifest 已记录事实，但 doctor 不消费它——用户手动改了组件文件、manifest 与文件系统漂移、孤儿文件，都无法被发现。
2. **版本与源的真实性**：`name@version` 是隐藏特性，manifest 不记录版本，缓存/构建增量策略不透明，供应链只有 integrity 自洽而无签名。
3. **规模化韧性**：组件数增长后，单源 + TTL 缓存 + 全量 build 会成为瓶颈；多项目/monorepo 场景未被一等公民对待。

## 总体原则（补充 v1）

- **manifest 是安装侧的事实源**：doctor/diff/remove/update 都应优先消费 manifest，目录扫描仅作兼容回退。
- **版本是一等契约**：组件版本应可被记录、约束、迁移，而非隐藏在 URL 拼接里。
- **缓存不可 silent 改变结果**：缓存命中仍须通过 integrity 校验；条件请求只减少流量，不绕过校验。
- **构建增量必须可证明**：增量命中要能用"全量 build 对照"证明结果一致，否则降级为全量。
- **安全分层**：integrity 防篡改，签名防伪造，SBOM 防供应链盲区，三者职责不同不可互相替代。

## P0：近期改进

### 1. doctor 消费 manifest，实现安装侧漂移检测

**问题**

[doctor.ts](../packages/cli/src/commands/doctor.ts) 的 `checkComponentIntegrity`（L306-353）名不副实——它只数组件目录下文件个数，不校验文件内容。`.brutx/manifest.json` 已记录每个已安装组件的 `integrity`、`files`、`dependencies`、`registryDependencies`，但 doctor 完全不读取它。结果是：

- 用户手动改了组件文件 → doctor 报 pass。
- manifest 记录的文件被删/被加 → doctor 不知道。
- manifest 引用了已不存在的 registry source → 无提示。
- 组件目录里有 manifest 未登记的孤儿文件（旧版本残留）→ 无提示。

**方案**

在 doctor 中新增三类检查，全部以 manifest 为驱动：

1. **manifest 与文件系统一致性**
   - manifest 记录的每个 `files` 条目是否存在。
   - 组件目录下是否存在 manifest 未登记的 `.vue`/`.ts` 文件（孤儿检测）。
   - 状态：`pass` / `warn`（孤儿）/ `error`（缺失）。
2. **integrity 漂移检测**
   - 按 manifest 记录的 `files` 重新计算 `computeRegistryIntegrity`，与 manifest `integrity` 比对。
   - 不一致 → `warn`（用户有意修改）+ 提示 `update` 可恢复。
   - 此检查复用 [shared/src/registry.ts](../packages/shared/src/registry.ts) 的 `computeRegistryIntegrity`，不在 CLI 复制算法。
   - **文件顺序契约（关键，否则会误报）**：`computeRegistryIntegrity` 以 `files.map(f=>f.content).join('\0')` 计算，**对数组顺序敏感**。registry build 用构建顺序（组件文件 → composables → directives → locales → lib）计算 integrity，而当前 [manifest.ts](../packages/cli/src/lib/manifest.ts) 写入时对 `files` 做了 `.sort()`。若 doctor 按 manifest 的字母序重算，哈希必然与 registry 的构建序哈希不同 → **即使用户未改动也会误报漂移**。落地时必须二选一：(a) manifest 不再 `.sort()`，按 registry build 顺序存储 `files`（推荐，最小改动）；(b) manifest 额外存 per-file content hash，doctor 逐文件比对而非重算总 integrity。**不可** 让 `computeRegistryIntegrity` 内部排序——会破坏存量 registry integrity。
   - **构建顺序稳定化（选 (a) 时的前置契约）**：选 (a) 时，registry build 顺序必须从"事实"升级为"契约"。当前 [build-registry.ts](../packages/registry/scripts/build-registry.ts) 的 `for (const name of componentNames)` 顺序来自 `Object.keys(manifest)`，而 `Object.keys` 顺序依赖 manifest 插入顺序，**非稳定契约**——若 [prebuild-scan.ts](../packages/ui/scripts/prebuild-scan.ts) 调整扫描顺序、或人工编辑 `registry-manifest.json`，旧 manifest 的 doctor 会误报漂移。落地时必须：registry build 以稳定排序（字典序）遍历 `componentNames`，或在 [registry-manifest.json](../packages/registry/registry/registry-manifest.json) 中额外存 `filesOrderHash` 字段（对 `files[].path` 数组本身求哈希），doctor 先比对 `filesOrderHash` 再决定是否重算总 integrity。此项必须与 (a) 同 PR 落地，否则 (a) 仍是脆性契约。
   - **路径归一**：manifest 存的是相对 cwd 的路径（带 alias 前缀，如 `src/components/ui/button/Button.vue`），registry `files[].path` 是 registry 相对路径（`components/ui/button/Button.vue`）。doctor 读盘后需剥离 alias 前缀才能与 registry 路径对齐，再读内容喂给 `computeRegistryIntegrity`。
3. **registryDependencies 闭环检查**
   - manifest 中每个组件的 `registryDependencies` 对应的组件是否也已在 manifest 中登记。
   - 缺失 → `warn` + 提示 `add <dep>`。

为保持 doctor 在无 manifest 的老项目上可用，所有 manifest 驱动的检查在 `readManifest` 返回 `null` 时降级为"目录扫描"模式（当前行为），并在报告中标注 `legacy scan`。

**验收**

- 手动修改已安装组件文件后，`doctor` 报 `warn` 并提示 integrity 漂移。
- 删除 manifest 记录的文件后，`doctor` 报 `error` 并列出缺失文件。
- 组件目录有未登记文件时，`doctor` 报 `warn` 并列出孤儿文件。
- 无 manifest 的项目仍能跑 doctor，输出标注 `legacy scan`。
- `doctor --json` 输出包含 `fixId`（如 `RestoreIntegrity`/`RemoveOrphans`），供 `--fix` 消费。
- `doctor` 默认检测**不触发网络**；`RestoreIntegrity` 仅在 `--fix` 显式触发时允许拉取 registry 或读缓存恢复权威内容，失败则降级为提示 `update`。
- `pnpm --filter brutx-vue test tests/doctor.test.ts` 覆盖上述四类场景，含「未改动但文件顺序不同」的反例（确保不误报）。

### 2. 缓存层升级：条件请求 + 并发去重 + 上限

**问题**

[cache.ts](../packages/cli/src/lib/cache.ts) 当前是 TTL-only：

- TTL 过期后必全量重下，不发送 `If-None-Match`/`If-Modified-Since`，无法利用 registry 的 304。
- 进程内无 in-flight 去重（并发安全储备，非现存 bug）：当前 [registry.ts](../packages/cli/src/lib/registry.ts) 的 `resolveDeps` 已用 `visited: Set<string>` 在单次调用内去重（A→C、B→C 只 fetch C 一次），且 CLI 暂无并发 `resolveDeps`/`getItem` 路径。但 `getItem` 自身无去重，未来若引入并发 `add` 或并发 `getItem`，同一 key 仍会重复请求。in-flight 去重定位为面向并发的安全储备。
- 无缓存大小上限：长期使用后 `~/.brutx-vue/cache/` 无限增长，`name@version` 切换会留下多版本缓存。
- 缓存键是 `sha256(source/name).slice(0,16)`，不含 registry manifest 版本——registry 升级后，旧缓存仍可能被命中（integrity 校验会兜底拦截，但每次都要下载完才发现不匹配，浪费流量）。

**方案**

- **条件请求**：缓存时一并存储 `etag`/`lastModified`（从 fetch 响应头读取）。TTL 过期后先发条件请求，304 则刷新 timestamp 并复用 body。
- **in-flight 去重**：在 [registry.ts](../packages/cli/src/lib/registry.ts) 进程级维护 `Map<cacheKey, Promise<RegistryItem>>`，同一 key 的并发请求共享同一 Promise。
- **LRU 上限**：缓存目录设默认上限（如 50MB 或 200 条），写入时按 `timestamp` 最旧淘汰。上限可通过环境变量 `BRUTX_CACHE_MAX` 覆盖。
- **registry 版本绑定**：缓存条目增加 `registryVersion` 字段（从 `registry-manifest.json` 读取）。registry 版本变化时，旧条目自动失效（不删除，但跳过）。
   - **拉取策略**：`getItem` 当前只 fetch `${source}/${name}.json`，不拉 manifest。获取 `registryVersion` 需进程级缓存一份 `registry-manifest.json`（首次 `getItem` 时按需拉取一次），避免每条目多一次请求。
   - **manifest 自身完整性校验（前置正确性）**：拉取 `registry-manifest.json` 后必须先校验其自身完整性，否则伪造 manifest 可让旧缓存"被认证"复用。当前 [registry-manifest.json](../packages/registry/registry/registry-manifest.json) 无 `integrity` 字段，仅有 `gitCommit`/`buildTimestamp`。落地时需二选一：(i) manifest 增加 `integrity` 字段（对 `items` 数组的规范化序列求 sha256，规范化时按 `name` 字典序排序以消除顺序依赖）；(ii) 等 P1-6 落地后用 `signature` 字段校验。在 (ii) 落地前，必须先用 (i)。**不可** 只读 `registryVersion` 就信任 manifest 内容。
   - **header 透传**：`fetchWithRetry` 返回 `Response` 后 `getItem` 现仅取 `res.json()` 丢弃响应头。存储 etag/lastModified 需改 `getCached`/`setCache` 签名以承载 header 字段。
- `clearCache` 增加 `--max-age` 参数支持只清理过期 N 天的条目。

**验收**

- 同一进程内并发 `getItem('button')` 只触发一次网络请求（覆盖未来并发路径，当前 CLI 暂无并发调用）。
- TTL 过期后，若 registry 返回 304，不重新下载 body，timestamp 刷新。
- 缓存目录超过上限时，最旧条目被自动淘汰。
- registry 版本升级后，旧缓存不被复用（integrity 校验前就跳过）。
- `pnpm --filter brutx-vue test tests/cache.test.ts` 覆盖去重、上限、版本失效。

### 3. 组件版本治理体系化

**问题**

`name@version` 已在 [registry.ts](../packages/cli/src/lib/registry.ts) L232-245 实现，但存在五个问题：

1. **未文档化**：用户不知道可以 `add button@v1.2.0`。
2. **manifest 不记录版本**：[manifest.ts](../packages/cli/src/lib/manifest.ts) 的 `InstalledComponentManifest` 只有 `integrity` 和 `registrySource`，没有 `version` 字段。`update` 无法知道"当前装的是哪个版本"，只能按 latest 比较。
3. **版本粒度是 git ref**：`name@version` 把 version 拼进 raw URL 的 ref 路径，本质是 git tag/branch，不是语义版本。没有兼容性判断，`add button@v0.5` 装到 v1 项目里不会报警。
4. **版本化依赖去重 bug（正确性缺陷）**：[registry.ts](../packages/cli/src/lib/registry.ts) `resolveDeps` 的 `visited` Set 以 `cleanName` 为键（已剥离 `@version`，见 L235/L250-252）。若组件 A 依赖 `button@v1`、组件 B 依赖 `button@v2`，两者 `cleanName` 都是 `button`，**第二个会被静默跳过，导致 v2 依赖树缺失**。这是版本特性升级为契约的前置正确性 bug。
5. **硬编码 URL 与 `--registry` 互斥**：`name@version` 把 source 硬编码为 `https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/${version}/...`（L242），且仅在 `itemSource === DEFAULT_REGISTRY_URL` 时生效（L241）。即用户传 `--registry` 镜像时 `@version` **被静默忽略**，行为不一致；同时违反项目"禁止硬编码"约定，与 Item 5（多源）直接冲突。

**方案**

- **manifest 扩展**：`InstalledComponentManifest` 增加 `version?: string` 字段（可选，向后兼容）。`add`/`update` 写入时记录用户指定的 version 或 `latest`。
- **registry-manifest 暴露版本索引**：[build-registry.ts](../packages/registry/scripts/build-registry.ts) 的 `RegistryBuildManifest` 已有 `registryVersion`，再增加 `schemaVersion` 和 per-item `versionRange`（可选，标记该组件引入/破坏性变更的 registry 版本）。
- **update 版本约束**：`update` 默认只更新到同 registry 主版本内的 latest；`update --across-versions` 才跨版本，并提示 breaking change。
- **修复版本化去重键**：`resolveDeps` 的 `visited`/`active` 键改为 `(cleanName, itemSource)` 二元组，确保不同 version 的同名组件各自解析。此修复是版本契约的正确性前置，对应问题 4。
   - **二元组语义收紧（避免实现者误读）**：`itemSource` 在 `@version` 时已被替换为 version-specific URL（见 L243），故二元组天然区分版本——同版本（相同 itemSource）仍去重、跨版本（不同 itemSource）各自解析。**不可** 把 `version` 字段也拼进键（会造成 A 和 B 都依赖 `button@v1` 时各拉一次，破坏现存去重行为）。键的语义是"同源同名即同一实例"，版本信息已隐含在 `itemSource` 中。
- **去硬编码 URL**：`name@version` 的 version 解析改为相对当前 `--registry`（或 `DEFAULT_REGISTRY_URL`）拼接 ref，而非硬编码 GitHub 仓库。与 Item 5 联动，对应问题 5。
   - **URL 重构的缓存迁移（落地必带）**：去硬编码后缓存键 `sha256(source/name)` 会变化（source URL 变了），旧缓存成为孤儿。当前 [clearCache](../packages/cli/src/lib/cache.ts) 是全量清空，无法只失效受影响条目。落地时必须二选一：(i) 在 `getCached` 读到旧键条目时，若 `registrySource` 字段与新拼接规则不符则跳过（自然过期，零迁移成本）；(ii) 一次性迁移脚本按旧→新键重命名。推荐 (i)，并在 release notes 标注"升级后旧缓存自动失效，无需手动 `cache clear`"。
- **`--registry` 与 `@version` 互斥说明**：在文档与 CLI 帮助中明确——使用镜像 `--registry` 时 `@version` 按相对该镜像解析（去硬编码后），或在该镜像不支持 version 时显式报错而非静默忽略。
   - **多源 fallback 与 `@version` 的交互（Item 5 落地时必须明确）**：Item 5 引入 `registries` 数组后，`@version` 应**仅相对主源解析**，fallback 链不参与 version 解析。理由：不同镜像的 git ref 语义可能不一致（镜像可能 lag 或重写 tag），让 fallback 链尝试 version 会导致"同一 `@version` 在不同镜像解析到不同内容"，破坏版本契约的可复现性。镜像 fallback 仅用于无版本约束的 `latest` 解析。
- **文档化**：在 docs 中公开 `name@version` 语法，说明 version 对应 git tag。
- **兼容性提示**：当 `add button@v0.5` 检测到当前项目 manifest 中已有 `v1` 的组件时，`warn` 提示版本混用风险。

**验收**

- `add button@v1.2.0` 后，manifest 记录 `version: "v1.2.0"`。
- `list` 显示每个已安装组件的版本。
- `update` 默认不跨 registry 主版本。
- docs 有 `name@version` 语法说明页，含 `--registry` 与 `@version` 互斥说明。
- 组件 A 依赖 `button@v1`、组件 B 依赖 `button@v2` 时，两者各自正确解析（覆盖去重键修复，对应问题 4）。
- `pnpm --filter brutx-vue test tests/manifest.test.ts` 覆盖 version 字段读写与向后兼容（无 version 的旧 manifest 仍可读）。

### 4. 构建增量透明化与性能基准

**问题**

[build-registry.ts](../packages/registry/scripts/build-registry.ts) 已有 `.registry-cache.json`（`CACHE_VERSION = 4`），但：

- 增量命中策略不透明——是按源文件 mtime？内容 hash？还是文件列表？无文档。
- 无"增量结果 == 全量结果"的自动证明，命中缓存后无法确认输出正确。
- 无并行构建——组件之间大多独立，当前是顺序处理（`for (const name of componentNames)` 串行，且全程使用同步 `fs.readFileSync`/`writeFileSync`）。
- 无性能基准线——组件数从 30 增长到 100 后，build 时间是否会劣化不可知。

**方案**

- **增量策略文档化**：在 `build-registry.ts` 顶部注释明确：缓存键 = 源文件内容 hash + `CACHE_VERSION` + shared 元数据 hash；命中条件与失效条件写清楚。
- **增量正确性校验**：CI/release 门禁中跑一次 `--no-cache` 全量 build，与增量 build 输出做 diff，二者必须完全一致。提供 `pnpm --filter brutx-registry-vue build:verify` 脚本。
   - **diff 排除字段（否则永远失败）**：`registry-manifest.json` 的 `buildTimestamp` 字段在两次 build 间必然不同，**必须在 P0-4 就显式排除**（不要等到 P1-6 才补）。排除集合：`{ "buildTimestamp" }`，其余字段（含 `gitCommit`、`registryVersion`、所有 items integrity）必须完全一致。`gitCommit` 在 CI 同次 run 内应一致，若 CI 环境注入了不同 `GITHUB_SHA`，diff 脚本需固定 `COMMIT_SHA` 环境变量后再比对。
- **并行构建**：组件级构建（`buildRegistryItem`）改为并发。**注意**：当前 `build-registry.ts` 全程使用同步 fs，`Promise.all` 对同步代码无并行效果——必须二选一：(a) 将构建路径改为 `fs/promises` 异步 API 后 `Promise.all` 并发；(b) 用 `worker_threads` 并行（CPU+I/O 均可并行）。依赖图校验 `assertRegistryDependencyGraph` 是**后置**检查（需 `registryIndex.items` 完整，见 [build-registry.ts L807](../packages/registry/scripts/build-registry.ts#L807)），不能前置。设置并发上限（如 8）避免 FS 抖动。此项待 `build:bench` 数据驱动，若同步构建非瓶颈可降级到 P1。
- **性能基准**：新增 `build:bench` 脚本，输出每个组件构建耗时与总耗时，写入 `.registry-cache.json` 旁的 `bench.json`。CI 中对比上次基准，回归 >20% 时告警。

**验收**

- `build-registry.ts` 顶部有增量策略注释，开发者能判断"改了这个文件会不会触发缓存失效"。
- `build:verify` 在 CI 通过，证明增量与全量输出一致。
- `build:bench` 输出耗时报告，组件数翻倍后总耗时增长 < 2x。
- `pnpm --filter brutx-registry-vue test tests/build-registry.test.ts` 新增缓存失效用例；并发构建用例待并行方案落地后补。

## P1：中期改进

### 5. 多 registry 源与离线韧性

**问题**

当前只有单一 `--registry` 参数 + `fetchWithRetry` 3 次重试。企业用户、镜像用户、断网场景都没有一等支持：

- 无镜像列表/fallback 链：主源挂了只能手动换 `--registry`。
- 无私有 registry 认证：企业内网 registry 需要 token/header。
- 无离线模式：断网时即使缓存命中，TTL 过期就直接失败。

**方案**

- **多源配置**：`components.json` 支持 `registries` 数组（主源 + 镜像），CLI 按序 fallback。命令行 `--registry` 临时覆盖。
- **认证**：从环境变量 `BRUTX_REGISTRY_TOKEN`/`BRUTX_REGISTRY_HEADERS` 读取，注入请求头。私有 registry URL 匹配时才注入。
- **离线模式**：`--offline` 只读缓存，TTL 过期也复用（但必须通过 integrity 校验）。`BRUTX_OFFLINE=1` 等效。
- **源健康检查**：`doctor` 增加 registry 可达性检查，列出各源延迟与状态。

**验收**

- 主源 500 时，自动 fallback 到镜像源，日志提示切换。
- `--offline` 模式下，缓存命中且 integrity 通过则成功；缓存未命中则给出明确离线错误。
- 私有 registry 请求带 token，公共 registry 不带。
- `doctor` 输出各 registry 源状态。

### 6. 供应链安全：签名与 SBOM

**问题**

[shared/src/registry.ts](../packages/shared/src/registry.ts) 的 `validateRegistryIntegrity` 只保证"files 内容与 integrity 字段自洽"，不能保证"registry JSON 真的来自维护者"——任何能改 registry 仓库的人都能同时改 files 和 integrity 字段。`registry-manifest.json` 已有 `gitCommit`，但消费侧不校验 commit 是否属于受信任分支。

**方案**

- **manifest 签名**：`registry-manifest.json` 增加 `signature` 字段（对 manifest 内容的 Ed25519 签名，base64）。CLI 在 `getItem` 首次拉取 manifest 时验签，公钥随 CLI 发布。需配套**密钥轮换**策略：公钥列表 + keyId，旧 key 签发的 manifest 在过渡期仍可信。
- **commit 可信校验**：CLI 缓存上次见过的 `gitCommit`，若新 commit 不在受信任分支历史内（通过 GitHub API 校验），`warn` 提示。
- **SBOM**：build 时生成 `registry-sbom.json`（SPDX/CycloneDX 格式），列出所有组件的 npm 依赖。`doctor --sbom` 可导出用户已安装组件的 SBOM。
- **可重复构建**：CI 中跑两次 build，diff 必须为空（除 `buildTimestamp` 外）。

**验收**

- 签名验证失败的 manifest 会被拒绝，错误码 `REGISTRY_SIGNATURE_INVALID`（**新增**，不复用 `REGISTRY_INTEGRITY_FAILED`——后者已表示内容自洽失败，混淆会让 error-advice 无法给出针对性建议）。
- `doctor --sbom` 生成用户项目的 SBOM 文件。
- CI 有可重复构建检查，`buildTimestamp` 之外的 diff 触发失败。

### 7. 依赖分析深化与依赖图导出

**问题**

[build-registry.ts](../packages/registry/scripts/build-registry.ts) 已有 `validateRegistryItemInternalImports`、`findRegistryDependencyCycles`、`assertKnownRegistryDeps`（后者已对未知 registry 组件 import **抛错**，`registryDependencies` 由 `extractRegistryDeps` 自动派生，不存在"声明与源码不一致"缺口），但：

- 依赖分类不明确：CSS import、type-only import、dynamic import 是否都被正确归类？
- 无依赖图导出：`validate-registry` 能否输出全量依赖图供可视化？

**方案**

- **import 分类**：明确四类（registry component / registry shared file / npm / style asset），用 `es-module-lexer` + TS AST 区分 type-only。在 `validate-utils.ts` 增加分类导出函数。
- **依赖图导出**：`validate-registry --graph` 输出 DOT + JSON 格式依赖图，供 docs/工具消费。

**验收**

- `validate-registry --graph` 生成 `deps.dot` 和 `deps.json`。
- type-only import 不被误计为 registry 依赖。
- docs 可消费 `deps.json` 渲染组件依赖关系图。

### 8. CLI 操作审计与全局 dry-run

**问题**

CLI 当前无操作日志——用户 add/remove 了什么、何时、从哪个源，只存在于 manifest 的 `installedAt`，remove 后即丢失。`add --dry-run` 之类的能力分散在各命令，无全局开关。

**方案**

- **审计日志**：在 `.brutx/audit.log`（JSONL）记录每次 add/remove/update/diff 的操作类型、组件名、源、integrity、时间戳、是否成功。`doctor` 可读审计日志辅助诊断。
- **全局 dry-run**：`BRUTX_DRY_RUN=1` 或 `--dry-run` 全局开关，所有写操作只打印不落盘。
- **verbose 等级**：`-v` 显示步骤，`-vv` 显示缓存命中/网络细节，`-vvv` 显示堆栈。

**验收**

- `add button` 后 `.brutx/audit.log` 有一行 JSONL 记录。
- `BRUTX_DRY_RUN=1 brutx-vue add button` 不修改任何文件，只打印将写入的路径。
- `doctor` 能从审计日志发现"上次 update 失败"等线索。

## P2：长期演进

### 9. 组件迁移引擎

**方向**

[registry.ts](../packages/cli/src/lib/registry.ts) 已有 `migrateConfig` 用于 config 版本迁移，但组件没有对应机制。当组件发生 breaking change（props 重命名、slot 变更），用户只能手动改代码。

**建议**

- 在 shared 元数据增加 `migrations: { fromVersion, toVersion, transform }` 字段。
- `update` 检测到组件版本跨越 breaking change 时，自动应用 transform（基于 AST 的 codemod）。
- `brutx-vue migrate <component>` 显式触发迁移。
- transform 失败时保留原文件并输出 diff。

**暂缓原因**

需先完成 Item 3（版本治理）使版本可被识别；codemod 编写成本高，应等真实 breaking change 出现时再驱动。

### 10. Monorepo 工作区一等公民支持

**方向**

[doctor.ts](../packages/cli/src/commands/doctor.ts) 已能 `detectWorkspaceRoot` 并读 root `package.json`，但 add/init/remove 不感知 workspace：在 monorepo 子包里 `add button` 不会复用 root 的依赖，`init` 不会为多个子包批量配置。

**建议**

- `init` 支持 `--workspace` 为 pnpm workspace 所有子包生成 `components.json`。
- `add`/`remove` 支持 `--all-packages` 批量操作。
- manifest 支持工作区级别（root `.brutx/manifest.json` 聚合子包记录）。
- `doctor` 在 workspace 根运行时检查所有子包一致性。

**暂缓原因**

当前用户群以单项目为主；monorepo 需求出现后再做，避免过度设计。

### 11. registry validate 与 build 的 watch 模式

**状态**：已完成（commit `1c8ea7d3`）

**方向**

开发新增组件时，每次改源码都要手动跑 `build` 才能在 CLI 测试。watch 模式可提升开发体验。

**建议**

- `pnpm --filter brutx-registry-vue build --watch` 监听 UI 源码变化，增量 rebuild 对应组件 JSON。
- 配合 `brutx-vue add --local-registry --watch` 实现组件开发热加载。

**落地说明**

- `build-registry.ts` 中 `REGISTRY` 改为 `let` + 导出 `reloadRegistry()`，watch 时可重新加载
- 新增 `runPrebuildScan()` 复用 prebuild-scan 逻辑，watch 时更新 `registry-manifest.json`（应对新增/删除文件）
- 新增 `runWatch()`：`fs.watch` 递归监听 UI 源码目录（components/composables/locales/lib/directives）+ `shared/src/components.ts`
- debounce 300ms + `isBuilding` 防并发 + `pendingChange` 追加触发
- `--watch` flag 或 `BRUTX_WATCH=1` 环境变量激活
- `package.json` 新增 `build:watch` 脚本
- 10 测试通过（reloadRegistry + runPrebuildScan 幂等性 + 覆盖配置）

**前置依赖**：Item 4（构建增量透明化）已完成（增量缓存策略文档化 + `--bench` + `build:verify`）。

## 路线图与优先级

| 阶段 | 目标 | 任务 | 验证 |
| --- | --- | --- | --- |
| 第 1 阶段 | 安装侧可观测 | Item 1（doctor 漂移检测） | doctor 单测、manifest 驱动检查 |
| 第 2 阶段 | 缓存与版本契约 | Item 2（缓存升级）、Item 3（版本治理） | cache 单测、manifest version 字段、docs |
| 第 3 阶段 | 构建信心 | Item 4（增量透明化） | build:verify、build:bench |
| 第 4 阶段 | 韧性与安全 | Item 5（多源）、Item 6（签名） | 离线测试、签名验证、SBOM |
| 第 5 阶段 | 开发体验 | Item 7（依赖图）、Item 8（审计） | graph 导出、audit.log |
| 第 6 阶段 | 长期演进 | Item 9/10/11 | 按需求驱动（Item 11 已完成） |

### P0：下一轮优先做

1. doctor 消费 manifest，实现 integrity 漂移与孤儿检测（ROI 最高，纯深化现有代码；落地前先修 manifest 文件顺序契约，否则误报）。
2. 缓存层升级（条件请求 + 并发去重 + 上限）。
3. 组件版本治理体系化（把 `name@version` 从隐藏特性升级为契约；含修 `resolveDeps` 去重键、去硬编码 URL——二者均为版本契约的正确性前置）。
4. 构建增量透明化与性能基准（增量文档化/verify/bench 先做；并行构建待 bench 数据驱动，必要时降级 P1）。

### P1：稳定后推进

1. 多 registry 源与离线韧性。
2. 供应链安全：签名与 SBOM。
3. 依赖分析深化与依赖图导出。
4. CLI 操作审计与全局 dry-run。

### P2：长期演进

1. 组件迁移引擎（依赖 Item 3）。
2. Monorepo 工作区一等公民。
3. ~~registry watch 模式（依赖 Item 4）~~ ✅ 已完成（commit `1c8ea7d3`）。

## 风险与取舍

- **不要让 doctor 变重**：漂移检测要复用 shared 的 `computeRegistryIntegrity`，不在 CLI 重写 hash 逻辑；检查默认只跑本地文件，不触发网络。
- **integrity 对文件顺序敏感**：`computeRegistryIntegrity` 以 `files.map(f=>f.content).join('\0')` 计算，顺序不同哈希不同。manifest 必须按 registry build 顺序存 `files`（不可 sort），否则 doctor 会误报漂移。
- **registry build 顺序必须稳定契约化**：选方案 (a) 时，`componentNames` 遍历顺序不能依赖 `Object.keys` 插入序——必须字典序遍历，或额外存 `filesOrderHash`。否则 prebuild-scan 调整顺序就会让旧 manifest 误报漂移，是 doctor 正确性的地基。
- **版本化去重必须按 (name, source) 键**：`resolveDeps` 的 `visited` 若仍按 `cleanName` 单键去重，版本化依赖会静默丢失，这是版本契约的前置正确性 bug。键语义是"同源同名即同一实例"，版本信息已隐含在 `itemSource` 中，**不可**额外拼 `version` 进键。
- **registry-manifest 自身必须可校验**：拉取 `registry-manifest.json` 信任 `registryVersion` 前，必须先校验 manifest 自身完整性（integrity 或 signature），否则伪造 manifest 可让旧缓存"被认证"复用。
- **不要破坏无 manifest 的老项目**：所有 manifest 驱动的检查必须有 `legacy scan` 降级路径。
- **不要让缓存成为事实源**：条件请求的 304 只省流量，不绕过 integrity；离线模式必须 integrity 通过才复用。
- **不要过早承诺版本语义**：`name@version` 当前是 git ref，在文档化时必须说清"version 等于 git tag"，不要包装成语义版本假象。
- **不要让签名变成发布阻塞**：签名验证失败时默认 `warn` 而非 `error`，除非用户显式 `--require-signature`，避免迁移期卡死。
- **不要为 monorepo 过度设计**：Item 10 明确暂缓，等真实需求。
- **增量构建必须可证伪**：`build:verify` 是硬门禁，增量与全量不一致时必须降级为全量并告警，不能 silent 用增量结果。

## 成功标准

完成 P0 后，辅助包应达到：

- `doctor` 能发现"用户手改了组件文件""manifest 与文件系统不一致""孤儿文件"三类问题。
- 缓存不再因 TTL 过期全量重下，并发解析不重复请求，目录不无限增长。
- 组件版本可被记录、查询、约束，`name@version` 语法有文档。
- registry build 的增量策略可读、可验证、可基准化。

完成 P1 后：

- 多源 fallback 与离线模式可用。
- registry manifest 有签名，CLI 验签，用户可导出 SBOM。
- 依赖图可导出，操作可审计。

## 修订记录

**v2.1（2026-07-12，经源码核验修订）**：对照 `packages/{cli,shared,registry}` 实际代码逐条核验基线与方案，应用以下修正：

- **P0-1**：补「文件顺序契约」与「路径归一」盲点——`computeRegistryIntegrity` 对数组顺序敏感，manifest 现 `.sort()` 会导致 doctor 误报漂移；明确 `RestoreIntegrity` 仅 `--fix` 时触网。
- **P0-2**：将 in-flight 去重从"现存 bug"更正为"并发安全储备"（`resolveDeps` 已有 `visited` 单调用内去重）；补 registry-manifest 拉取策略与 header 透传改造。
- **P0-3**：新增问题 4（`resolveDeps` 按单键 `cleanName` 去重导致版本化依赖静默丢失）与问题 5（`name@version` 硬编码 GitHub URL、与 `--registry` 互斥）；补对应修复子任务与验收。
- **P0-4**：纠正"同步 fs 下 `Promise.all` 无并行效果"；并行方案改为 async fs 或 worker_threads 二选一；依赖图校验定位改"后置"；并行构建可降级 P1。
- **P1-6**：签名失败错误码改为新增 `REGISTRY_SIGNATURE_INVALID`，不复用 `REGISTRY_INTEGRITY_FAILED`；补密钥轮换策略。
- **P1-7**：删除不成立的"隐式依赖校验"条目——`assertKnownRegistryDeps` 已对未知 import 抛错、`registryDependencies` 自动派生。
- **风险与取舍**：新增「integrity 顺序敏感」「版本化去重键」两条约束。

**v2.2（2026-07-16，盲点补强修订）**：经二次源码核验，补强 6 个落地盲点，均为补强性质（不影响 v2.1 的可行性结论）：

- **P0-1**：补「构建顺序稳定化」——`Object.keys(manifest)` 非稳定契约，选方案 (a) 时必须字典序遍历 `componentNames` 或存 `filesOrderHash`，否则 prebuild-scan 调整顺序会让旧 manifest 误报漂移。此项与 (a) 必须同 PR。
- **P0-2**：补「manifest 自身完整性校验」——拉取 `registry-manifest.json` 信任 `registryVersion` 前必须先校验其自身完整性（当前无 `integrity` 字段），否则伪造 manifest 可让旧缓存"被认证"复用。在 P1-6 签名落地前先用 manifest `integrity` 字段过渡。
- **P0-3**：补「二元组语义收紧」——`(cleanName, itemSource)` 键中版本信息已隐含在 `itemSource`，**不可**额外拼 `version` 进键（会破坏同版本去重）；补「URL 重构的缓存迁移」——去硬编码后旧缓存键失效，推荐自然过期方案；补「多源 fallback 与 `@version` 交互」——`@version` 仅相对主源解析，fallback 链不参与 version 解析。
- **P0-4**：补「diff 排除字段」——`buildTimestamp` 必须在 P0-4 就显式排除（不要等 P1-6），否则 `build:verify` 永远失败；顺带纠正 `assertRegistryDependencyGraph` 行号 L914→L807。
- **风险与取舍**：新增「registry build 顺序必须稳定契约化」「registry-manifest 自身必须可校验」两条约束。
