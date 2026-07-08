# 辅助包 Bug 扫描报告

- **扫描日期**：2026-07-09
- **扫描范围**：`packages/cli`、`packages/registry`、`packages/shared`（不含 `packages/ui`）
- **扫描方法**：全文件只读审查 + 跨包一致性交叉验证 + 实测 `pnpm test packages/registry`
- **发现问题**：CLI 18 项 / Registry 12 项 / Shared 6 项（部分跨包重叠）
- **修复状态**：未修改任何文件，仅产出报告

---

## 修复优先级概览

| 优先级 | 数量 | 关键问题 |
|--------|------|----------|
| 立即修复（跨包） | 3 | settings-page 残留导致测试失败；缓存哈希遗漏 composable/locale 依赖；构建失败未设退出码 |
| 高 | 3 | doctor --fix 恒失败；diff 误报 not-installed；remove 依赖检查静默失效 |
| 中 | 9 | 文件事务回滚顺序、孤儿文件路径解析、SFC 正则脆弱、shared 桶导出遗漏等 |
| 低 | 14 | 类型断言、防御性校验、死代码、包独立性等 |

---

# 立即修复（跨包，影响 CI / 测试门禁）

## X1. `settings-page` 残留导致 4 个 registry 测试失败

- **涉及文件**：
  - [packages/shared/src/component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-files.ts) — 无 `settings-page` 条目
  - [packages/shared/src/component-registry.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts) — 无 `settings-page` 条目
  - [packages/registry/tests/build-registry.test.ts:37](file:///e:/project/brutxui-vue3/packages/registry/tests/build-registry.test.ts#L37) — 仍断言 `COMPONENT_REGISTRY['settings-page'].category`
  - [packages/registry/tests/build-registry.test.ts:343](file:///e:/project/brutxui-vue3/packages/registry/tests/build-registry.test.ts#L343) — 仍调用 `buildRegistryItem('settings-page')`
  - [packages/registry/tests/__snapshots__/build-registry.test.ts.snap:82-122](file:///e:/project/brutxui-vue3/packages/registry/tests/__snapshots__/build-registry.test.ts.snap) — 仍保留 `settings-page` 快照（含 `status: 'legacy'`、`replacement: 'tabs'`、registryDependencies 含未注册的 `empty-state`）
- **类别**：跨包一致性 / 测试正确性
- **描述**：`settings-page` 之前存在但已从 shared 包移除，未同步更新 registry 测试与快照。
- **实测影响**：`pnpm test packages/registry` 结果 `Test Files 1 failed | 1 passed (2)`、`Tests 4 failed | 32 passed (36)`，其中 4 项失败包含 2 项 `settings-page` 崩溃 + 2 项快照完整性过期。
- **建议修复**：
  1. 删除 `build-registry.test.ts:37` 的 `settings-page` 相关断言
  2. 删除 `build-registry.test.ts:343` 的 `buildRegistryItem('settings-page')` 调用
  3. 从快照文件删除 `settings-page` 块
  4. 重建 button / data-table 快照（见 X4）

## X2. Registry 缓存哈希遗漏 composable/locale 依赖

- **文件**：[packages/registry/scripts/build-registry.ts:146-207](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L146)（重点 168-192）
- **类别**：缓存正确性 / 构建脚本正确性
- **描述**：`computeSourceHash` 用于计算缓存哈希以决定是否复用旧 JSON。但它只对 component 文件抽取了 `lib` 依赖（第 170 行）和 component→component 依赖，**未抽取 `composables` 和 `locales` 依赖**；对 composable 文件（第 182 行）和 directive 文件（第 192 行）也只抽取了 `lib` 依赖。

  对照 `buildRegistryItem`（第 524-528 行）实际会抽取 component/composable/locale/lib 四类依赖，并通过 `processComposables`（466-493）递归发现 composable→composable 依赖。
- **影响**：当任一**传递发现的** composable/locale 内容变化时，源哈希保持不变，缓存命中并复用过时 JSON。受影响组件至少 83 个（所有从 `@/composables/` 导入但未在 `COMPONENT_FILES` 显式声明的组件）。
- **证据**：`packages/registry/registry/button.json` 实际包含 `composables/useLocale.ts`、`composables/useGlitchEffect.ts`、`composables/useReducedMotion.ts`，但 `packages/shared/src/component-files.ts` 中 `button` 条目未列出任何 composables，因此这些文件内容未参与 `computeSourceHash`。
- **建议修复**：在 `computeSourceHash` 中补齐与 `buildRegistryItem` 一致的依赖抽取：

  ```typescript
  // 组件文件循环内
  extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
  extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
  // composable 文件循环内
  extractDeps(content, 'composables').forEach(d => composableDeps.add(d));
  extractDeps(content, 'locales').forEach(d => localeDeps.add(d));
  // directive 文件循环内
  extractDeps(content, 'composables').forEach(d => composableDeps.add(d));
  ```

  然后将 composableDeps、localeDeps 的文件内容也纳入哈希。

## X3. Registry 构建失败未设置非零退出码

- **文件**：[packages/registry/scripts/build-registry.ts:820-822](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L820)
- **类别**：错误处理 / 构建脚本正确性
- **描述**：组件构建失败时仅 `console.warn` 提示 `errorCount`，未调用 `process.exitCode = 1`。
- **影响**：CI 无法检测到部分组件构建失败，污染的注册表可能被发布。
- **建议修复**：

  ```typescript
  if (errorCount > 0) {
    console.warn(`Registry build completed with ${errorCount} error(s).`);
    process.exitCode = 1;
  }
  ```

## X4. button / data-table 快照完整性过期

- **文件**：[packages/registry/tests/__snapshots__/build-registry.test.ts.snap](file:///e:/project/brutxui-vue3/packages/registry/tests/__snapshots__/build-registry.test.ts.snap)
- **类别**：测试正确性
- **描述**：button 快照期望 `sha256-66c7ed2d...`，实际 `sha256-f776aabb...`（与 `registry-manifest.json` 第 137 行一致）；data-table 期望 `sha256-39922565...`，实际 `sha256-108d4cfa...`。
- **影响**：两个快照测试失败。
- **建议修复**：删除快照文件后用 `pnpm test -- -u` 重建（仅针对这两个测试），或先修复 X1/X2 后统一更新。

---

# 高优先级（CLI 逻辑错误，影响功能正确性）

## H1. `doctor --fix` 修复成功后仍必定抛错

- **文件**：[packages/cli/src/commands/doctor.ts:503-541](file:///e:/project/brutxui-vue3/packages/cli/src/commands/doctor.ts#L503)（重点 534-541）
- **类别**：逻辑错误 / 状态管理
- **描述**：`doctor()` 在调用 `applyFixes(checks, options)` 之后立即检查 `checks.some(c => c.status === 'error')`。但 `applyFixes`（368-501）在应用修复后**不会更新 `checks` 数组中各项的 `status`**——它只修改文件与 `config` 对象，原 `checks` 仍保留修复前的 `error`/`warn` 状态。结果：只要初始检查存在任何 error（哪怕 `--fix` 已全部修复成功），最后仍会 `throw new CliError('Doctor check failed with errors')`，使 `--fix` 看起来总是失败。
- **建议修复**：在 `applyFixes` 成功后重新运行检查并刷新 `checks`，或在 `applyFixes` 内部把已修复项的 `status` 改为 `'pass'`，或当 `options.fix` 已应用时跳过最终的 `hasErrors` 抛错。

## H2. `diffComponent` 在 registry 不可达时误报 `not-installed`

- **文件**：[packages/cli/src/lib/services/diff-service.ts:119-134](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/diff-service.ts#L119)
- **类别**：错误处理缺失 / API 契约违反
- **描述**：`getItem` 抛错（网络故障、校验失败、404 等）被 `catch { registryItem = null; }` 静默吞掉，随后无条件返回 `status: 'not-installed'`，**即使本地文件存在**。`DiffComponentStatus` 类型中定义了 `'local-only'`（types.ts:188），但全代码库从未赋值该状态。[diff.ts:59-65](file:///e:/project/brutxui-vue3/packages/cli/src/commands/diff.ts#L59) 将 `not-installed` 标为 "NOT IN REGISTRY (local only)"，标签与状态名自相矛盾。当 registry 短暂不可达时，已安装组件会被误报为"未安装"。
- **建议修复**：在 `getItem` 失败时先检查 `localFiles`；若本地存在则返回 `status: 'local-only'`；区分"registry 中不存在"与"无法访问 registry"。

## H3. `getDependents` 静默吞掉所有错误，导致依赖警告失效

- **文件**：[packages/cli/src/lib/services/remove-service.ts:197-208](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/remove-service.ts#L197)
- **类别**：错误处理缺失
- **描述**：`getDependents` 对每个剩余组件调用 `getItem`，`catch {}` 完全吞掉所有错误（含网络/校验失败）。当 registry 不可达时，所有依赖关系检查都会失败，`dependents` Map 始终为空，`remove` 命令不会发出任何"X 依赖 Y"的警告，可能让用户误删被其他组件依赖的组件。
- **建议修复**：区分"组件确实无依赖"与"无法获取依赖信息"；后者应输出警告或让 `prepareRemoveComponents` 在结果中标记 `dependencyCheckFailed`。

---

# 中优先级

## M1. `checkComponentIntegrity` 检查层级错误

- **文件**：[packages/cli/src/commands/doctor.ts:305-336](file:///e:/project/brutxui-vue3/packages/cli/src/commands/doctor.ts#L305)
- **类别**：逻辑错误
- **描述**：组件实际位于 `<componentsPath>/ui/<name>/`（见 add.ts:118 的 `import ... from "${componentsAlias}/ui/${component}/..."`）。但 `checkComponentIntegrity` 只 `readdir(componentsPath)` 顶层，得到的是 `['ui']`，于是输出 `component ui` 检查项，`files.length` 实际是 `ui/` 下子目录数，而非真实文件数。空组件目录（如 `ui/empty/`）永远不会被发现。
- **建议修复**：递归进入 `ui/` 子目录检查每个组件目录。

## M2. `resolveComponentFilePath` 的 `libUtils` 分支误判

- **文件**：[packages/cli/src/lib/services/add-service.ts:84-85](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/add-service.ts#L84)
- **类别**：逻辑错误
- **描述**：分支条件 `registryPath === 'lib/utils' || registryPath.startsWith('lib/utils/')` 对两种情况都执行 `resolved = await resolveAliasPath(config.aliases.utils, cwd) + '.ts'`。对于 `lib/utils/foo`，这会把内容写到 utils 文件本身（覆盖 `cn()`），而非 `lib/utils/foo` 子文件。当前 registry 未使用 `lib/utils/...` 路径（已验证 registry 仅用 `lib/<file>.ts`），所以是**潜伏 bug**——一旦 registry 加入此类路径就会触发覆盖。
- **建议修复**：仅对 `registryPath === 'lib/utils'`（精确匹配）走 utils 文件分支；`lib/utils/...` 应落入后续 `lib/` 分支或单独处理。

## M3. `addBrutalistStyles` 部分标记检测导致重复注入

- **文件**：[packages/cli/src/lib/services/init-service.ts:89-100](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L89)
- **类别**：逻辑错误 / 边界条件
- **描述**：仅当 `--color-brutal-bg`、`.bg-brutal-primary`、`.animate-in` 三个标记**全部**存在时才跳过；若 CSS 仅包含部分标记（用户手动删过部分），会把整段 brutalist CSS 再次 append，造成重复定义。此外 `content += await getBrutalistCssStyles()`（行 95）不加分隔换行，若原文件不以 `\n` 结尾，新内容会拼接到原最后一行尾部。
- **建议修复**：改用幂等注入（如 `// brutx-ui-start` / `// brutx-ui-end` 标记块替换），并在 append 前确保换行。

## M4. `findOrphanedFiles` 对嵌套 import 路径解析错误

- **文件**：[packages/cli/src/lib/services/remove-service.ts:147-180](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/remove-service.ts#L147)（尤其 159）
- **类别**：逻辑错误
- **描述**：`fileName = importPath.split('/').pop()` 只取最后一段。对于 `@/composables/useFoo/bar`，`fileName = 'bar'`，然后 `resolveScriptFile(composablesPath, 'bar')` 只查 `composables/bar.ts`，而非 `composables/useFoo/bar.ts`。嵌套路径的孤儿文件无法被识别删除。
- **建议修复**：保留完整相对路径（去掉前缀 alias），用 `path.join(baseDir, relativePath)` 解析。

## M5. `FileTransaction.rollback` 顺序在 copy 失败时丢失原始数据

- **文件**：[packages/cli/src/lib/file-transaction.ts:52-63](file:///e:/project/brutxui-vue3/packages/cli/src/lib/file-transaction.ts#L52)
- **类别**：资源泄漏 / 部分失败处理
- **描述**：回滚时先 `await fs.remove(targetPath)` 再 `await fs.copy(snapshot.backupPath, targetPath)`。若 `copy` 失败（权限、磁盘满、备份损坏），原文件已被删除，数据丢失。对于目录快照尤其严重——`fs.remove(A)` 会递归删除整个目录。
- **建议修复**：先 copy 到临时位置（如 `targetPath.restore.tmp`），成功后再原子重命名替换；或对文件用 `fs.copy` 覆盖而非先 remove。

## M6. `writeComponentFiles` 回滚不清理新建的空目录

- **文件**：[packages/cli/src/lib/services/add-service.ts:166-194](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/add-service.ts#L166)
- **类别**：资源泄漏
- **描述**：写入文件前 `fs.ensureDir(path.dirname(targetPath))` 会创建多级目录，但回滚时只恢复/删除文件本身，新建的空目录（如 `components/ui/accordion/`）残留。多次失败重试后会留下空目录树。
- **建议修复**：回滚时记录并清理新建的空目录，或使用 `FileTransaction`（其 `ensureDir` 已被快照）替代裸 `fs.ensureDir`。

## M7. `extractScriptBlocks` 正则脆弱

- **文件**：[packages/registry/scripts/build-registry.ts:289-298](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L289)
- **类别**：SFC 解析正确性
- **描述**：使用 `/<script\b[^>]*>([\s\S]*?)<\/script>/gi` 非贪婪匹配。若 SFC 内部字符串字面量（如模板字符串或注释）包含 `</script>`，会提前截断，导致 `es-module-lexer` 解析的代码段不完整，import 改写遗漏。
- **影响**：当前代码库未出现此类用法，但属于隐患。
- **建议修复**：使用 `@vue/compiler-sfc` 的 `parse` 替代手写正则；或至少对 `<script setup>` 与普通 `<script>` 分别匹配并校验闭合。

## M8. `extractStaticModuleSpecifiers` 误匹配带空格的动态导入

- **文件**：[packages/registry/scripts/validate-utils.ts:393-402](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L393)
- **类别**：验证正确性
- **描述**：正则 `/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g` 会把 `import ('./x')`（import 与括号间有空格）误判为静态导入并提取 `'./x'`。
- **影响**：可能将动态导入的模块加入内部导入校验集合，产生误报或漏报。
- **建议修复**：在正则中排除紧随 `import` 的左括号，或改用 TS AST（与 `build-registry.ts` 的 `extractModuleSpecifiers` 保持一致）。

## M9. Shared 桶导出遗漏关键类型

- **文件**：[packages/shared/src/index.ts:1-27](file:///e:/project/brutxui-vue3/packages/shared/src/index.ts#L1)
- **类别**：导出/导入问题 / 跨包契约
- **描述**：`index.ts` 只重新导出 `RegistryComponentMeta` 一个类型，未导出 `ComponentCategory`、`SidebarGroup`、`ComponentKind` 三个类型。然而这些类型在跨包消费中是必需的：
  - [apps/docs/.vitepress/theme/lib/sidebar-generator.ts:2](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/lib/sidebar-generator.ts#L2) 被迫直接 `import type { ComponentCategory, SidebarGroup } from '../../../../../packages/shared/src/types'`，绕过包名导入，破坏包边界
  - [packages/cli/src/lib/types.ts:127](file:///e:/project/brutxui-vue3/packages/cli/src/lib/types.ts#L127) 等位置通过 `RegistryItem['category']` 等间接索引方式访问类型，可读性差且与 `ComponentRegistryEntry` 字段定义重复耦合
- **建议修复**：

  ```typescript
  export type { ComponentCategory, SidebarGroup, ComponentKind } from './types.js';
  ```

---

# 低优先级（防御性 / 一致性）

## CLI

### L1. `cache.ts` 不安全的类型断言

- **文件**：[packages/cli/src/lib/cache.ts:33](file:///e:/project/brutxui-vue3/packages/cli/src/lib/cache.ts#L33)
- **类别**：类型安全
- **描述**：`await fs.readJson(filePath) as { data: T; timestamp: number }` 仅做类型断言不做运行时校验。若缓存文件被外部篡改为 `{ data: "string", timestamp: "not-a-number" }`，`Date.now() - raw.timestamp` 为 `NaN`，`NaN > ttl` 为 `false`，缓存被误判有效，返回错误形状的 `data` 给调用方，可能导致后续 `RegistryItem` 访问 `item.files` 时崩溃。
- **建议修复**：对 `raw.timestamp` 做 `typeof === 'number'` 校验，否则视为缓存失效。

### L2. `--no-cache` 选项在 TypeScript 类型中缺失

- **文件**：[packages/cli/src/commands/add.ts:146](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts#L146)、[diff.ts:76](file:///e:/project/brutxui-vue3/packages/cli/src/commands/diff.ts#L76)、[list.ts:112](file:///e:/project/brutxui-vue3/packages/cli/src/commands/list.ts#L112)、[update.ts:11](file:///e:/project/brutxui-vue3/packages/cli/src/commands/update.ts#L11)
- **类别**：类型安全 / API 契约
- **描述**：commander 的 `--no-cache` 在运行时设置 `options.cache === false`，但 `AddOptions`/`DiffOptions`/`ListOptions`/`UpdateOptions` 接口均未声明 `cache?: boolean`，所以每处都要写 `(options as Record<string, unknown>).cache === false`。一旦某命令漏写这层 cast，cache 行为会静默失效。
- **建议修复**：在各 Options 接口补 `cache?: boolean`。

### L3. `removeComponents` 的 `totalRemoved` 把目录计入文件数

- **文件**：[packages/cli/src/lib/services/remove-service.ts:279-282](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/remove-service.ts#L279)
- **类别**：逻辑错误 / 输出误导
- **描述**：`const files = await fs.readdir(componentPath)` 返回所有条目（含子目录），`totalRemoved += files.length` 把子目录也当文件计数。最终输出"Removed N file(s)"会偏大。
- **建议修复**：用 `{ withFileTypes: true }` 仅统计 `isFile()`，或递归统计真实文件数。

### L4. `mergeSnippetsFile` 对既有 snippets 文件做不安全断言

- **文件**：[packages/cli/src/lib/vscode-snippets.ts:378](file:///e:/project/brutxui-vue3/packages/cli/src/lib/vscode-snippets.ts#L378)
- **类别**：类型安全
- **描述**：`existingSnippets = await fs.readJson(snippetPath) as VscodeSnippetFile`。若用户手写的 snippets 文件是数组或 null，断言通过但后续 `existingSnippets[snippetKey] = ...` 行为异常，序列化后可能丢失数据。
- **建议修复**：用 `isRecord` 校验后再赋值，否则视为空对象。

### L5. `info` 命令在组件既不在 registry 也不在本地时报 `'unknown'`

- **文件**：[packages/cli/src/commands/info.ts:63-70](file:///e:/project/brutxui-vue3/packages/cli/src/commands/info.ts#L63)
- **类别**：API 契约
- **描述**：`status` 默认 `'unknown'`，仅三个分支覆盖。当 `!registryItem && localFiles.length === 0` 时保留 `'unknown'`，但更准确的语义应是 `'not-found'` 或 `'not-installed'`。`info` 也不暴露 registry fetch 错误（行 57-59 静默 catch），用户无法区分"组件不存在"与"网络失败"。
- **建议修复**：新增 `'not-found'` 状态；catch 中保留 error 供 `--json` 输出。

### L6. `MIN_NODE_VERSION` 与项目约定不一致，且对预发布版本误判

- **文件**：[packages/cli/src/commands/doctor.ts:13](file:///e:/project/brutxui-vue3/packages/cli/src/commands/doctor.ts#L13)、15-22
- **类别**：逻辑错误 / 边界条件
- **描述**：`MIN_NODE_VERSION = '22.0.0'`，但 AGENTS.md 声明 Node.js 22.5+。当前实现下 `22.0.0` 也会通过检查，比文档约定更宽松。此外 `version.split('.').map(Number)` 对 `22.0.0-rc.1` 会产生 `patch = NaN`，`NaN >= 0` 为 `false`，导致预发布版本被拒。
- **建议修复**：将常量改为 `'22.5.0'`（与文档对齐）；解析版本时先截断预发布后缀（`-` 之后部分）。

### L7. `configureNuxtConfig` 写失败后手动恢复与事务逻辑冲突

- **文件**：[packages/cli/src/lib/services/init-service.ts:193-211](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L193)
- **类别**：错误处理
- **描述**：`transaction.writeFile` 失败时，catch 用 `fs.writeFile(configPath, original)` 手动恢复（行 203），然后返回 `'write-failed'` 而不抛错。但 `FileTransaction` 已对 nuxt config 做了快照，外层 `initializeProjectFiles` 的 `transaction.commit()`（行 246）会照常提交并清理快照——手动恢复与事务快照功能重叠。若手动恢复失败（`fs.writeFile` 抛错被 `.catch(() => {})` 吞掉），文件会停留在损坏状态，而事务仍提交成功。
- **建议修复**：去掉手动恢复，让事务回滚处理；或在手动恢复失败时让事务回滚。

### L8. `resolveDeps` 的版本覆盖检查用 `source` 而非 `itemSource`

- **文件**：[packages/cli/src/lib/registry.ts:230-242](file:///e:/project/brutxui-vue3/packages/cli/src/lib/registry.ts#L230)
- **类别**：逻辑错误（潜伏）
- **描述**：`let itemSource = inheritedSource ?? source;` 后，版本解析分支检查的是 `if (source === DEFAULT_REGISTRY_URL)` 而非 `if (itemSource === DEFAULT_REGISTRY_URL)`。当父依赖通过 `inheritedSource` 传入一个版本化 registry URL，而用户又用默认 registry 调用时，子组件的 `@version` 后缀会强制覆盖 `itemSource`，覆盖 `inheritedSource` 的版本约束。当前行为可能符合"用户显式版本优先"的意图，但语义模糊。
- **建议修复**：明确文档化"用户 `@version` 优先于 inheritedSource"，或改为检查 `itemSource`。

### L9. `extractScriptBlocks` 正则在含 `</script>` 字符串的 SFC 中提前截断

- **文件**：[packages/cli/src/lib/project.ts:237-252](file:///e:/project/brutxui-vue3/packages/cli/src/lib/project.ts#L237)
- **类别**：边界条件
- **描述**：`/<script\b[^>]*>([\s\S]*?)<\/script>/gi` 用惰性匹配，遇到 `<script>` 内的字符串字面量 `'</script>'` 会提前结束，导致 `es-module-lexer` 解析的代码段不完整，import 改写遗漏。虽属已知正则局限，但 Vue SFC 中（如示例代码片段）确实可能出现。
- **建议修复**：用 `@vue/compiler-sfc` 解析 SFC，或至少处理字符串/模板中的 `</script>` 转义。

## Registry

### L10. `buildRegistryItem` 返回值可选链不一致

- **文件**：[packages/registry/scripts/build-registry.ts:597](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L597) vs 599-601
- **类别**：类型安全 / 代码一致性
- **描述**：相邻字段对 `meta` 的访问一处用可选链、一处直接访问，风格不统一。若 `meta` 可能为 undefined，存在潜在空指针；若不会，可选链多余。
- **建议修复**：统一为直接访问（若 `COMPONENTS[name]` 保证存在）或统一可选链。

### L11. `validateRegistryManifestConsistency` 未校验 `gitCommit`/`buildTimestamp` 类型

- **文件**：[packages/registry/scripts/validate-utils.ts:128-209](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L128)
- **类别**：schema 一致性
- **描述**：`registry-manifest.json` 中 `gitCommit`/`buildTimestamp` 当前为 `null`，验证函数未对二者类型做断言，发布时可能写入非法值（如非字符串或非 ISO 时间戳）。
- **建议修复**：增加 `assertOptionalNonEmptyString` 或专门的 ISO8601 校验。

### L12. `getFileType` 对 `index.ts` 误分类

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts)（`getFileType` 函数）
- **类别**：文件分类正确性
- **描述**：`index.ts`（如 `composables/index.ts` 或 `lib/index.ts`）会被归为 `registry:ui` 而非 `registry:lib`/`registry:hook`，与 shadcn 语义不符。
- **影响**：消费者拿到错误 type 字段。
- **建议修复**：在 type 判定逻辑中优先按目录前缀（`composables/`→hook、`lib/`→lib）判断，再回退到文件名启发式。

### L13. 缓存复用 catch 块静默吞错

- **文件**：[packages/registry/scripts/build-registry.ts:682](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L682)、756
- **类别**：错误处理
- **描述**：读取缓存 JSON 失败时仅 `catch {}` 后回退到重建，未记录原因。
- **影响**：磁盘/权限问题被掩盖，难排查缓存总是失效的根因。
- **建议修复**：在 catch 中 `console.warn` 输出文件名与错误消息。

### L14. React 依赖检查不完整

- **文件**：[packages/registry/scripts/validate-registry.ts:345-348](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-registry.ts#L345)
- **类别**：验证正确性
- **描述**：仅检查 `@radix-ui`、`lucide-react` 等 5 个固定包名，未覆盖 `react`、`react-dom`、`next/*` 等。
- **建议修复**：改为黑名单 + 关键字匹配（包含 `react` 且非 `reka-ui`/`v-calendar` 等合法包）。

### L15. 跨包耦合：validate-registry.ts 导入 apps/docs

- **文件**：[packages/registry/scripts/validate-registry.ts:23](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-registry.ts#L23)
- **类别**：跨包问题
- **描述**：`import ... from '../../../apps/docs/.vitepress/theme/lib/sidebar-generator'` 使 registry 包构建/测试依赖 docs 应用源码，破坏包独立性。
- **建议修复**：将 `sidebar-generator` 下沉到 `packages/shared`，或通过接口注入校验逻辑。

## Shared

### L16. `feedback-form` 与 `cookie-consent` 分类不一致

- **文件**：
  - [packages/shared/src/components.ts:73-74](file:///e:/project/brutxui-vue3/packages/shared/src/components.ts#L73)
  - [packages/shared/src/component-registry.ts:13-90](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts#L13)（`CATEGORY_OVERRIDES`）
- **类别**：数据完整性 / 一致性
- **描述**：这两个组件都声明为 `kind: 'block'`、`sidebarGroup: 'blocks-sections'`，与 `header-section`、`footer-section`（同组 block）属同一类。但 `header-section`/`footer-section` 因名字以 `-section` 结尾被 `inferCategory` 推断为 `'marketing'`，而 `feedback-form`/`cookie-consent` 不匹配任何推断模式（不以 -page/-section/-hero/-card/-shell/-stats 结尾，不包含 glitch/scratch/noise/typewriter），落入默认 `'utility'`。
- **影响**：`COMPONENTS_BY_CATEGORY['utility']` 错误地包含了两个 block 类组件；与同类 block（`brutalist-hero`/`pricing-section`/`header-section`/`footer-section` 均为 `marketing` 或 `layout`）的归类不一致。
- **建议修复**：在 `CATEGORY_OVERRIDES` 显式添加：

  ```typescript
  'cookie-consent': 'marketing',
  'feedback-form': 'marketing',
  ```

  或者在 `components.ts` 中给两者加 `category: 'marketing'`。

### L17. `page` 类别为死代码

- **文件**：
  - [packages/shared/src/types.ts:10](file:///e:/project/brutxui-vue3/packages/shared/src/types.ts#L10)
  - [packages/shared/src/component-registry.ts:143](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts#L143)、171
  - [packages/shared/src/registry.ts:251](file:///e:/project/brutxui-vue3/packages/shared/src/registry.ts#L251)
- **类别**：数据完整性 / 跨包一致性
- **描述**：`ComponentCategory` 包含 `'page'`，`inferCategory` 有 `endsWith('-page')` 分支，`createComponentsByCategory` 初始化了 `page: []` 数组，但 `COMPONENTS` / `COMPONENT_FILES` 中没有任何 `-page` 后缀组件，也没有 `CATEGORY_OVERRIDES` 条目返回 `'page'`。结果 `COMPONENTS_BY_CATEGORY['page']` 永远为空数组。
- **跨包影响**：与 X1 同源。`settings-page` 已不在 shared 中，但 registry 测试与快照仍引用它。
- **建议修复**：与 X1 一并处理——若 `settings-page` 确实废弃，则：
  1. 从 `ComponentCategory` 移除 `'page'`
  2. 从 `inferCategory` 移除 `endsWith('-page')` 分支
  3. 从 `createComponentsByCategory` 移除 `page: []`
  4. 从 `assertCategory` 的 categories 列表移除 `'page'`
  5. 修复/删除 registry 测试和快照

### L18. `COMPONENTS` 的 `as const` 与显式类型注解冲突

- **文件**：[packages/shared/src/components.ts:3](file:///e:/project/brutxui-vue3/packages/shared/src/components.ts#L3)、96
- **类别**：类型定义
- **描述**：`export const COMPONENTS: Record<string, RegistryComponentMeta> = { ... } as const;`。显式类型注解 `Record<string, RegistryComponentMeta>` 会强制把字面量类型拓宽为 `RegistryComponentMeta`（其 `dependencies: string[]` 是可变数组）；`as const` 产生的 `readonly ["reka-ui"]` 仅因 TS 的不健全性（readonly 数组可赋值给 mutable 数组）才通过类型检查，但消费方看到的类型仍是可变 `string[]`。`as const` 实际对消费方类型无影响，仅起误导作用——让人误以为是深度只读。
- **影响**：误导维护者；若有人依赖只读语义（如尝试 `COMPONENTS.alert.dependencies.push(...)`），运行时会真的修改源数组，与 `as const` 暗示的只读相悖。
- **建议修复**：要么删除 `as const`，要么删除 `Record<string, RegistryComponentMeta>` 注解让 `as const` 真正生效（但会改变下游类型，需评估）。当前最简单的是删 `as const`。

### L19. `assertIntegrity` 仅校验前缀，不校验哈希格式

- **文件**：[packages/shared/src/registry.ts:324-332](file:///e:/project/brutxui-vue3/packages/shared/src/registry.ts#L324)
- **类别**：边界条件 / 校验薄弱
- **描述**：`assertIntegrity` 只检查 `typeof value === 'string' && value.startsWith('sha256-')`。`'sha256-'`（空哈希）、`'sha256-Garbage'`、`'sha256-' + 'a'.repeat(10)` 都能通过结构校验。真正的完整性由 `validateRegistryIntegrity` 单独计算 SHA-256 并比对——这一步是健壮的，但 `validateRegistryItem` 阶段的早期失败信号弱。
- **建议修复**：用 `/^sha256-[a-f0-9]{64}$/` 校验格式。

### L20. 隐式 Node.js 依赖未在 `package.json` 声明

- **文件**：
  - [packages/shared/src/registry.ts:1](file:///e:/project/brutxui-vue3/packages/shared/src/registry.ts#L1)（`import crypto from 'node:crypto';`）
  - [packages/shared/src/index.ts:21-26](file:///e:/project/brutxui-vue3/packages/shared/src/index.ts#L21)
  - [packages/shared/package.json](file:///e:/project/brutxui-vue3/packages/shared/package.json)
- **类别**：跨包契约 / 包元数据
- **描述**：`registry.ts` 顶层 `import crypto from 'node:crypto'`，使整个包在浏览器环境会因 `node:crypto` 无法解析而失败。但 `package.json` 没有 `engines` 字段、没有 `browser` 字段、没有把 `registry.ts` 拆分到单独入口。当前唯一被消费方"误打误撞"避开的方式是 docs 直接从 `component-registry.ts` 文件路径导入（绕开 `index.ts`）。
- **影响**：低（当前所有 Node 端消费方都能用）；但对未来潜在的浏览器端消费（如把 sidebar-generator 逻辑搬进 SSR/CSR 边界）是个雷。
- **建议修复**：在 `package.json` 加 `"engines": { "node": ">=22.5" }`；或把 `registry.ts` 拆为单独子路径导出（如 `brutx-shared-vue/registry`），让 `index.ts` 不引入 `node:crypto`。

---

# 跨包一致性问题

## A. `validateRegistryIndex` 未检测 `items` 内重名

- **文件**：[packages/shared/src/registry.ts:128-153](file:///e:/project/brutxui-vue3/packages/shared/src/registry.ts#L128)
- **类别**：校验完整性
- **描述**：`validateRegistryIndex` 验证 `items` 是数组并逐项校验，但不检查 `items[].name` 是否重复。重复检测目前在消费方 [packages/registry/scripts/validate-registry.ts:107-115](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-registry.ts#L107) 手写实现。作为共享校验器，这个缺口意味着 CLI 端（[packages/cli/src/lib/registry.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/registry.ts) 不调用 `validateRegistryIndex`）和任何未来消费方都需要自己补这一步。
- **建议修复**：可选——在 `validateRegistryIndex` 中加 `items` 重名检查，把校验集中到 shared。

---

# 已确认无问题的方面

为避免误报，以下类别经审查后未发现真实 bug：

## CLI
- **命令注入**：`package-manager.ts` 的 `sanitizePackageName` 严格过滤 `[^a-zA-Z0-9@/._-]`，且 `spawn` 配合 `--` 分隔符，注入风险已妥善处理。
- **路径穿越（用户输入）**：`isSafePath` + `verifyWrittenPath` 双重校验，`resolveAliasPath` 强制校验解析后路径在 cwd 内，`registry.ts` 对本地 registry 也做了 `filePath.startsWith(path.resolve(source) + path.sep)` 校验。
- **原型污染**：`manifest.ts` 的 `isRecord` 显式排除数组，`migrateConfig` 用展开拷贝 `{ ...raw }`，未发现 `__proto__` 注入风险。
- **未关闭的资源**：`fetchWithRetry` 用 `AbortSignal.timeout`，`spawn` 的 SIGINT listener 在 `close`/`error` 都移除，无泄漏。
- **循环依赖检测**：`resolveDeps` 用 `active` Set 检测环，`active.delete` 在 catch 中也执行，无遗漏。

## Registry
- `COMPONENT_FILES`（86 项）与 shared 包的 `COMPONENT_FILES` 完全一致（仅再导出，引用相等，由测试 `expect(REGISTRY_COMPONENT_FILES).toBe(COMPONENT_FILES)` 保证）。
- `buildRegistryItem` 的依赖解析逻辑（component/composable/locale/lib 四类）与 `processComposables` 的递归发现逻辑正确。
- `validateRegistryIntegrity` 的 SHA-256 计算与比对健壮（用 `'\0'` 分隔符是合理选择，源码不会含 null 字符）。

## Shared
- `COMPONENTS`（86 项）与 `COMPONENT_FILES`（86 项）键集合完全一致，`createComponentRegistry` 还做了双向完整性自检（任一缺失即抛错）。
- 所有 11 个 `ComponentCategory` 值在 `createComponentsByCategory` 中都有初始化，`groups[entry.category]` 不会越界。
- `registry.ts` 中 `assertLifecycleReplacement`、`assertStatus`、`assertCategory` 的类型 narrowing 顺序正确。
- 无循环依赖：`types.ts` 无导入；`components.ts` ← `types.ts`；`component-files.ts` 无内部导入；`component-registry.ts` ← 三者；`registry.ts` ← `types.ts` + `node:crypto`；`index.ts` 仅再导出。
- `formatTitle`（kebab→Title Case）对 `card-3d` → `'Card 3d'` 是预期行为（与 components.ts 一致风格）。

---

# 修复建议优先级

## 阶段 1：恢复测试门禁（跨包）
1. **X1** — 清理 `settings-page` 残留 + 删除对应测试断言与快照
2. **X4** — 重建 button / data-table 快照
3. **L17** — 一并移除 `'page'` 死代码

## 阶段 2：保证发布物正确性
4. **X2** — 补全 `computeSourceHash` 的 composable/locale 依赖抽取
5. **X3** — 构建失败设置 `process.exitCode = 1`

## 阶段 3：恢复 CLI 命令可用性
6. **H1** — `doctor --fix` 修复后重跑检查刷新 `checks`
7. **H2** — `diff` 区分 `not-installed` 与 `local-only`
8. **H3** — `remove` 在 registry 不可达时输出依赖检查失败警告

## 阶段 4：数据安全与一致性
9. **M5** — `FileTransaction.rollback` 改用先 copy 后 replace
10. **M4** — `findOrphanedFiles` 保留完整相对路径
11. **M9** — Shared 补齐桶导出类型
12. **L16** — `feedback-form`/`cookie-consent` 分类修正

## 阶段 5：低优先级清理
13. **L1-L15** + **L18-L20** + **跨包 A** — 可在一个独立 PR 集中处理

---

# 附：实测验证

执行 `pnpm test packages/registry` 结果：

```
Test Files  1 failed | 1 passed (2)
     Tests  4 failed | 32 passed (36)
```

4 个失败测试分别对应 X1（2 个，含 settings-page 崩溃）与 X4（2 个快照完整性不匹配），与分析一致。

---

**报告完毕**。本次为只读扫描，未修改任何文件。
