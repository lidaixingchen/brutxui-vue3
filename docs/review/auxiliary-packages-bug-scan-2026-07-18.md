# BrutxUI-Vue3 辅助包 Bug 扫描报告

> **扫描日期**：2026-07-18
> **审查范围**：`packages/cli`、`packages/registry`、`packages/shared` 三个辅助包的全部源码（不含 tests/ 和构建产物 JSON）
> **审查方法**：纯人工代码审查，未运行任何静态检查工具或测试
> **对照基线**：[auxiliary-packages-bug-scan-2026-07-12.md](./auxiliary-packages-bug-scan-2026-07-12.md)（共 34 项 bug：C1-C4、M1-M11、L1-L19）
> **验证方式**：所有新发现均通过 Grep/Read 交叉验证了触发链路

---

## 一、摘要

本次扫描的核心结论是：**上轮 34 项 bug 中 32 项已彻底修复，2 项部分修复**；本轮新发现 **6 项 bug**（1 Medium、5 Low）。整体质量显著提升，最严重的注册表文件遗漏问题（C1-C4）已通过 AST 扫描机制根本性解决，CLI 的核心流程（事务、缓存、命令注入）均已加固。

| 类别 | 数量 | 说明 |
|------|------|------|
| 上轮已修复 | 32/34 | C1-C4 全部修复；M1-M11、L1-L19 中除 L3、L4 外全部修复 |
| 上轮部分修复 | 2/34 | L3（仍用正则）、L4（残留 env 读取，但语义已变） |
| 本轮新发现 | 6 | 1 Medium + 5 Low |
| 本轮 Critical | 0 | 无 |

**总体评估**：

- `packages/shared`：`component-files.ts` 已被 `scan-component-files.ts`（AST 扫描）替代，C1-C4 根因消除。`COMPONENT_METADATA` 构造已加浅拷贝，分类与侧边栏生成均已修复。
- `packages/cli`：`FileTransaction` 事务机制完善，`add`/`create`/`init`/`doctor` 命令链路均正确处理回滚。`matchFileByPath` 已改为严格相等。残留风险集中在 `resolveImportAlias` 对 `@/lib/` 别名的非对称处理（新发现 N1）。
- `packages/registry`：`rewriteImports` 已限制在 `<script>` 块内，locale 传递依赖已纳入 `buildRegistryItem`，`computeSourceHash` 不动点迭代已合并为单一循环。`LIB_FILE_EXCLUDE` 排除 `utils.ts` 后其传递依赖仍被扫描（L17 已修复）。本轮新发现的均为低风险问题。

---

## 二、上轮 Bug 修复状态追踪

### Critical（4/4 已修复）

| Bug | 状态 | 修复方式 | 验证 |
|-----|------|----------|------|
| C1 `tabs` 缺失 `Tabs.vue` | ✅ 已修复 | `scan-component-files.ts` 递归扫描组件目录，自动发现所有 `.vue`/`.ts`/`.css` 文件 | [packages/shared/src/scan-component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/scan-component-files.ts) `listComponentFiles` |
| C2 `popover` 缺失 `Popover.vue`/`PopoverTrigger.vue`/`index.ts` | ✅ 已修复 | 同上，AST 扫描自动捕获 | 同上 |
| C3 `tooltip` 缺失 `TooltipProvider.vue` | ✅ 已修复 | 同上 | 同上 |
| C4 `chat-bubble` 缺失 `ChatContainer.vue` | ✅ 已修复 | 同上 | 同上 |

### Medium（11/11 已修复）

| Bug | 状态 | 修复方式 | 验证 |
|-----|------|----------|------|
| M1 `matchFileByPath` 假阳性匹配 | ✅ 已修复 | 改为前缀剥离后严格相等比较 | [packages/cli/src/lib/services/diff-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/diff-service.ts#L19-L29) L19-L29 |
| M2 `--path` 模式 snippets 写错目录 | ✅ 已修复 | snippets 检测和写入使用 `targetCwd` | [packages/cli/src/commands/add.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts) |
| M3 `create` 命令注入 | ✅ 已修复 | 添加 `PROJECT_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/` 校验 | [packages/cli/src/commands/create.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/create.ts) |
| M4 Nuxt 配置写入失败未回滚 | ✅ 已修复 | `initializeProjectFiles` 在 `nuxt.status === 'write-failed'` 时抛异常触发 `rollback` | [packages/cli/src/lib/services/init-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L281-L283) L281-L283 |
| M5 `validateComponents` 阻止自定义 registry | ✅ 已修复 | `registryOverride` 存在时跳过白名单校验 | [packages/cli/src/commands/add.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts#L61-L63) L61-L63 |
| M6 `rewriteImports` 正则过度匹配 | ✅ 已修复 | `./` 重写仅在 `<script>` 块内执行 | [packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L469-L477) L469-L477 |
| M7 Locale 文件未通过 `rewriteImports` | ✅ 已修复 | `run()` 中 locale 文件调用 `rewriteImports` | [packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L926) L926 |
| M8 `buildRegistryItem` 不处理 locale 传递依赖 | ✅ 已修复 | 添加 locale 文件读取和依赖提取 | [packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L703-L717) L703-L717 |
| M9 `computeSourceHash` 不动点迭代顺序 | ✅ 已修复 | 合并 composables 和 locales 为单一 while 循环 | [packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L392-L411) L392-L411 |
| M10 `COMPONENTS_BY_CATEGORY` 含 block | ✅ 已修复 | `createComponentsByCategory` 跳过 `kind === 'block'` | [packages/shared/src/component-metadata.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-metadata.ts) |
| M11 `getComponentsByCategory` 返回可变引用 | ✅ 已修复 | 返回 `[...COMPONENTS_BY_CATEGORY[category]]` 浅拷贝 | [packages/shared/src/component-metadata.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-metadata.ts) |

### Low（17/19 已修复，2 项部分修复）

| Bug | 状态 | 修复方式 | 备注 |
|-----|------|----------|------|
| L1 `extractDependencies` 仅扫顶层 | ✅ 已修复 | 改用 `scanComponentFiles` 递归遍历 | |
| L2 `removeComponents` 文件计数 | ✅ 已修复 | `countFilesRecursive` 递归统计 | |
| L3 `injectNuxtConfig` 正则 | ⚠️ 部分修复 | 限制在 `defineNuxtConfig` 根对象块内，但仍用正则非 AST | 仍存在边界情况风险，但已大幅缩小攻击面 |
| L4 `BRUTX_NO_CACHE` 副作用 | ✅ 已修复（语义已变） | `add.ts`/`update.ts` 不再设置 env，改为参数传递；env 读取保留在 `cache.ts`/`registry.ts` 作为**用户侧全局开关** | 见下方"部分修复说明" |
| L5 CSS marker 硬编码 | ✅ 已修复 | 使用 `escapeRegex` + 常量构造正则 | |
| L6 `info` 死代码 | ✅ 已修复 | 状态分支重写为 if-else 链 | |
| L7 `doctor` 报告时序 | ✅ 已修复 | `applyFixes` 后重新运行检测刷新 `checks` 数组 | |
| L8 `diffComponent` 吞异常 | ✅ 已修复 | 捕获 `registryError` 并设置 `registry-unreachable` 状态 | |
| L9 directive 传递依赖 | ✅ 已修复 | 添加 `extractDeps(code, 'directives')` | |
| L10 无扩展名导入假设 `.ts` | ✅ 已修复 | `resolveExtension` 检查 `.vue` 和 `.ts` 两个候选 | |
| L11 反引号模板字面量 | ✅ 已修复 | AST 方案替代正则 | |
| L12 排序方式不一致 | ✅ 已修复 | `validateRegistryManifestConsistency` 使用 `localeCompare` | |
| L13 错误处理不一致 | ✅ 已修复 | `computeSourceHash` 对缺失文件抛异常 | |
| L14 动态 `import()` | ✅ 已修复 | AST 处理 `ts.isCallExpression` + `ImportKeyword` | |
| L15 正则引号不一致 | ✅ 已修复 | 全部使用反向引用 `(['"])...\1` | |
| L16 跨组件导入校验 | ✅ 已修复 | `extractCrossComponentImports` 检查 `registryDependencies` | |
| L17 `utils.ts` 传递依赖 | ✅ 已修复 | 排除后仍读取内容并提取 `extractDeps`，仅跳过 `parts.push` | [packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L418-L424) L418-L424 |
| L18 数组引用共享 | ✅ 已修复 | `createComponentMetadata` 浅拷贝数组字段 | |
| L19 侧边栏孤儿组件 | ✅ 已修复 | `buildFallbackGroup` 归入"其他"/"Other" | |

#### L4 部分修复说明

`BRUTX_NO_CACHE` 环境变量当前在以下位置被读取：
- [packages/cli/src/lib/cache.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/cache.ts#L52-L54) L52-L54（`isCacheDisabled()`）
- [packages/cli/src/lib/registry.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/registry.ts#L115) L115（`getItem`）
- [packages/cli/src/lib/registry.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/registry.ts#L356) L356（`resolveDeps`）

**上轮 bug 描述**：`add.ts`/`update.ts` 在命令内部设置 `process.env.BRUTX_NO_CACHE = '1'` 且不清除，导致同进程后续调用受影响。

**当前状态**：`add.ts`/`update.ts` 已改为通过 `useCache` 参数传递（不再设置 env）。env 读取保留作为**用户侧全局开关**——用户可在 shell 中执行 `BRUTX_NO_CACHE=1 brutx-vue add button` 来全局禁用缓存。这是设计意图，不再是 bug。测试文件（`cache.test.ts`、`diff.test.ts`、`update.test.ts`、`remove.test.ts`、`registry.test.ts`）显式设置/清理该 env，符合预期。

---

## 三、本轮新发现（6 项）

### N1（Medium）：`resolveImportAlias` 对 `@/lib/` 别名导入的非对称处理

- **文件**：[packages/cli/src/lib/project.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/project.ts#L276-L279) L276-L279
- **类别**：别名解析 / 逻辑不一致
- **问题描述**：

  `resolveImportAlias` 对 `@/composables/`、`@/locales/`、`@/directives/` 三类别名导入在 `sharedBase` 未设置时**无条件重写**为用户配置的别名：

  ```ts
  } else if (imp.n.startsWith('@/composables/')) {
      newPath = sharedBase
          ? imp.n.replace('@/composables', `${sharedBase}/hooks`)
          : imp.n.replace('@/composables', composablesAlias);   // ← 总是重写
  } else if (imp.n.startsWith('@/lib/')) {
      if (sharedBase) {
          newPath = imp.n.replace('@/lib', `${sharedBase}/lib`);
      }
      // ← sharedBase 未设置时什么都不做！
  }
  ```

  但 `@/lib/`（非 utils）仅在 `sharedBase` 设置时才重写。registry 构建阶段 `rewriteImports` 将 `../lib/foo` 统一改写为 `@/lib/foo`，因此发布的 JSON 中 lib 文件之间的导入形如 `@/lib/foo`。

  **触发链路**（默认配置下不触发）：
  1. 用户自定义 `components.json` 中 `aliases.utils` 为 `@/utils`（而非默认 `@/lib/utils`）
  2. CLI 安装 `lib/foo` 文件时，[add-service.ts L98-L106](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/add-service.ts#L98-L106) 将其写入 `path.dirname(resolveAliasPath('@/utils'))` = `src/`
  3. 但文件内容中 `@/lib/foo` 导入未被重写，经 tsconfig `@/* → src/*` 解析后指向 `src/lib/foo`
  4. 文件实际位于 `src/foo`，导入路径指向 `src/lib/foo`，运行时 `Cannot find module`

- **触发条件**：用户自定义 `aliases.utils` 脱离 `@/lib/utils` 形态，且组件含多个 lib 文件（如 `data-table-utils.ts`、`env.ts`）。
- **影响范围**：当前 11 个组件含 lib 文件依赖（`data-table`、`carousel`、`cascader`、`combobox`、`date-picker`、`tree-select` 等），但默认配置下均不触发。
- **建议修复**：

  ```ts
  } else if (imp.n.startsWith('@/lib/')) {
      if (sharedBase) {
          newPath = imp.n.replace('@/lib', `${sharedBase}/lib`);
      } else {
          // 与 composables/locales/directives 保持对称：重写到用户配置的 lib 目录
          const libAlias = config.aliases.utils.replace(/\/utils$/, '/lib');
          newPath = imp.n.replace('@/lib', libAlias);
      }
  }
  ```

  或更彻底：在 `DEFAULT_ALIASES` 中新增独立的 `lib` 别名字段，解耦 utils 文件路径与 lib 目录路径。

---

### N2（Low）：`NON_COMPONENT_DEP_NAMES` 含不存在的 `locale-en`

- **文件**：[packages/registry/scripts/validate-utils.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L161-L164) L161-L164
- **类别**：死代码 / 数据一致性
- **问题描述**：

  ```ts
  const NON_COMPONENT_DEP_NAMES = new Set<string>([
      'locale-zh-cn',
      'locale-en',   // ← 不存在此 registry 项
  ])
  ```

  `build-registry.ts` L920 的 `LOCALE_FILES = ['zh-CN.ts', 'types.ts']` 仅构建 `locale-zh-cn.json`，不存在 `locale-en.json`。过滤 `locale-en` 是无操作。该条目暗示 `locale-en` 可能存在，会误导后续维护者认为 en locale 也通过 registry 发布。

  **补充说明**：经验证 `en` locale 仅被 `packages/ui/src/components/**/*.test.ts`（41 处）导入，运行时代码（如 `useLocale.ts`）只导入 `zh-CN` 和 `types`，因此 `LOCALE_FILES` 列表本身是正确的。问题仅在于 `NON_COMPONENT_DEP_NAMES` 的误导性条目。

- **建议修复**：删除 `locale-en` 条目，或添加注释说明其为前瞻性占位。

---

### N3（Low）：`sanitizePackageName` 破坏 npm alias 语法

- **文件**：[packages/cli/src/lib/package-manager.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/package-manager.ts#L12-L14) L12-L14
- **类别**：输入处理 / 兼容性
- **问题描述**：

  ```ts
  function sanitizePackageName(name: string): string {
      return name.replace(/[^a-zA-Z0-9@/._-]/g, '');
  }
  ```

  该正则仅保留 `a-zA-Z0-9@/._-`，会剥离 `:` 和 `=`。npm 支持的 alias 语法 `pkg@npm:other-pkg@1.0.0` 经 sanitize 后变为 `pkgnpmother-pkg1.0.0`，导致安装命令错误。

  **触发条件**：用户在 `components.json` 的 `dependencies` 中声明 npm alias（如 `"date-fns": "date-fns@npm:date-fns-latest@2.30.0"`），CLI 调用 `installPackages` 时包名被错误清洗。
- **当前影响**：registry 的 `dependencies` 字段当前均为标准包名（无 alias），不触发。但未来若引入 alias 依赖则会出错。
- **建议修复**：扩展白名单包含 `:` 和 `=`，或改用 npm 官方包名校验正则：

  ```ts
  function sanitizePackageName(name: string): string {
      // 允许 npm alias 语法：pkg@npm:other-pkg@version
      return name.replace(/[^a-zA-Z0-9@:/._=-]/g, '');
  }
  ```

---

### N4（Low）：`probeHttpSource` 使用 GET 而非 HEAD 探测可达性

- **文件**：[packages/cli/src/commands/doctor.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/doctor.ts#L631-L655) L631-L655
- **类别**：性能 / 资源浪费
- **问题描述**：

  ```ts
  const res = await fetch(probeUrl, {
      method: 'GET',   // ← 下载完整 manifest（可能数 MB）
      signal: AbortSignal.timeout(10000),
  });
  ```

  `probeHttpSource` 用于 `doctor` 命令的 registry 可达性检测，仅需判断 HTTP 状态码。使用 GET 会下载完整 `registry-manifest.json`（当前约 30KB，随组件数增长），浪费带宽并延长 `doctor` 执行时间。HTTP HEAD 请求即可获取状态码而不传输 body。

- **触发条件**：每次运行 `brutx-vue doctor`（非离线模式）都会对每个 registry source 发起 GET 请求下载完整 manifest。
- **建议修复**：

  ```ts
  const res = await fetch(probeUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
  });
  ```

  注意：部分静态托管服务（如 GitHub Pages）对 HEAD 请求的响应可能与 GET 不同，需验证兼容性后部署。

---

### N5（Low）：`resolveFromTsConfig` 仅使用 paths 数组的首个目标

- **文件**：[packages/cli/src/lib/project.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/project.ts#L203-L207) L203-L207
- **类别**：功能限制
- **问题描述**：

  ```ts
  if (paths[aliasPattern]) {
      const targetPath = paths[aliasPattern][0];   // ← 仅取首个
      const resolvedBase = targetPath.replace('/*', '');
      return path.join(cwd, baseUrl, resolvedBase, relativePath);
  }
  ```

  TypeScript 的 `paths` 配置支持多个 fallback 目标（数组），如：

  ```json
  {
    "paths": {
      "@/*": ["src/*", "app/*"]
    }
  }
  ```

  当前实现仅尝试 `paths[0]`，若该目标不存在对应文件，不会 fallback 到 `paths[1]`。这会导致在多目标 paths 配置的项目中，CLI 解析别名路径失败。

- **触发条件**：用户 tsconfig 的 `paths` 配置含多个 fallback 目标，且首个目标不包含 CLI 要写入的文件。
- **建议修复**：遍历 `paths[aliasPattern]` 数组，返回首个实际存在文件的路径；或至少在首个目标解析失败时记录 warning。

---

### N6（Low）：`extractScriptBlocks` 正则可能因 `</script>` 字符串字面量提前截断

- **文件**：[packages/cli/src/lib/project.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/project.ts#L236-L248) L236-L248
- **类别**：已知限制 / 文档化
- **问题描述**：

  ```ts
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  ```

  非贪婪匹配 `[\s\S]*?` 会在遇到首个 `</script>` 字符串时停止。若 `<script>` 块内的字符串字面量（如 `const endTag = '</script>'`）包含该子串，正则会提前截断，导致后续 import 解析遗漏。

  **补充说明**：代码注释已明确记录此限制（L232-L235），并建议切换到 `@vue/compiler-sfc`。当前代码库不触发此问题（已验证无组件源码含 `</script>` 字符串字面量）。

- **触发条件**：组件 `<script>` 块内出现 `</script>` 字符串字面量。当前未触发。
- **建议修复**：迁移到 `@vue/compiler-sfc` 的 `parse` 函数，使用其 `descriptor.script.content` 精确提取脚本块。

---

## 四、修复优先级建议

### P1（建议尽快修复——功能边界缺陷）

| Bug | 文件 | 简述 | 影响 |
|-----|------|------|------|
| N1 | `cli/src/lib/project.ts` L276-L279 | `@/lib/` 别名非对称处理 | 自定义 `aliases.utils` 时非 utils 的 lib 文件导入断裂 |

### P2（计划修复——低风险隐患）

| Bug | 文件 | 简述 | 影响 |
|-----|------|------|------|
| N2 | `registry/scripts/validate-utils.ts` L161-L164 | `locale-en` 死代码 | 误导维护者，无功能影响 |
| N3 | `cli/src/lib/package-manager.ts` L12-L14 | npm alias 语法被破坏 | 未来引入 alias 依赖时出错 |
| N4 | `cli/src/commands/doctor.ts` L635 | GET 探测浪费带宽 | `doctor` 执行变慢 |
| N5 | `cli/src/lib/project.ts` L203 | paths fallback 未实现 | 多目标 paths 项目中解析失败 |
| N6 | `cli/src/lib/project.ts` L236 | `</script>` 正则限制 | 文档化限制，当前不触发 |

---

## 五、未列为 bug 但值得关注的设计观察

以下为审查中发现的设计选择，经评估后判定**非 bug**，但记录备查：

### O1：`LOCALE_FILES` 仅含 `zh-CN.ts` 和 `types.ts`

- **位置**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L920) L920
- **观察**：`en.ts` 不在发布列表中。
- **评估**：`useLocale.ts` 仅导入 `zh-CN` 和 `types`，`en.ts` 仅被测试文件导入（41 处 `.test.ts`）。registry 不发布 `en.ts` 是正确的——它不是运行时依赖。

### O2：`BRUTX_NO_CACHE` 环境变量保留

- **位置**：[packages/cli/src/lib/cache.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/cache.ts#L52-L54) L52-L54、[packages/cli/src/lib/registry.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/registry.ts#L115) L115
- **观察**：`cache.ts` 和 `registry.ts` 仍读取 `process.env.BRUTX_NO_CACHE`。
- **评估**：这是**用户侧全局开关**（如 `BRUTX_NO_CACHE=1 brutx-vue add button`），与上轮 L4 bug 中"CLI 内部设置且不清除"的语义不同。当前 `add.ts`/`update.ts` 通过 `useCache` 参数传递，不再设置 env。设计正确。

### O3：`utils.ts` 被双重排除

- **位置**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L81) L81（`SCAN_LIB_EXCLUDE`）、L119（`LIB_FILE_EXCLUDE`）
- **观察**：两个常量都排除 `utils.ts`。
- **评估**：`SCAN_LIB_EXCLUDE` 用于 `scanComponentFiles`——不将 `utils.ts` 列入 manifest 的 lib 文件列表。`LIB_FILE_EXCLUDE` 用于 build——读取 `utils.ts` 内容并提取其依赖（L418-L420），但跳过 `parts.push`（L422-L424）不发布内容。两者职责不同，非重复。`utils.ts` 是项目特定文件（提供 `cn()`），消费者通过 CLI `init` 创建自己的 `lib/utils.ts`。

### O4：`buildRegistrySbom` 对 `integrity` 字段去前缀

- **位置**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L791) L791
- **观察**：`item.integrity.replace(/^sha256-/, '')` 剥离 `sha256-` 前缀后填入 SBOM 的 `hashes.content`。
- **评估**：CycloneDX 规范要求 `hashes.content` 为纯十六进制哈希值，而 registry 的 `integrity` 字段采用 SRI 格式（`sha256-xxx`）。剥离前缀是符合规范的处理，非 bug。

---

## 六、附录：审查文件清单

### CLI 包（核心源码）
`src/commands/{add,create,diff,doctor,info,init,list,remove,update}.ts`
`src/lib/{cache,constants,error,file-transaction,installed-components,logger,manifest,package-manager,project,registry,registry-source,signature,types,vscode-snippets}.ts`
`src/lib/services/{add-service,diff-service,init-service,remove-service,index}.ts`
`src/lib/audit.ts`

### Registry 包
`scripts/{build-registry,validate-registry,validate-utils,verify-build}.ts`

### Shared 包
`src/{component-metadata,components,extract-module-specifiers,index,registry,scan-component-files,sidebar-generator}.ts`

### UI 包（仅验证 locale 依赖）
`src/locales/{index,en,zh-CN,types}.ts`
`src/composables/useLocale.ts`
