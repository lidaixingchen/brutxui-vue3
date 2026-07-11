# BrutxUI-Vue3 辅助包 Bug 扫描报告

> **扫描日期**：2026-07-12
> **审查范围**：`packages/cli`、`packages/registry`、`packages/shared` 三个辅助包的全部源码（不含 tests/ 和构建产物 JSON）
> **审查方法**：纯人工代码审查，未运行任何静态检查工具或测试
> **验证方式**：所有 Critical/High 发现均通过 Grep/Read 交叉验证了触发链路

---

## 一、摘要

本次扫描共发现 **34 项** bug，按包和严重程度分布如下：

| 包 | Critical | Medium | Low | 小计 |
|------|----------|--------|-----|------|
| `packages/shared` | 4 | 2 | 2 | 8 |
| `packages/cli` | 0 | 5 | 8 | 13 |
| `packages/registry` | 0 | 4 | 9 | 13 |
| **合计** | **4** | **11** | **19** | **34** |

**总体评估**：

最严重的问题集中在 `packages/shared` 包的 `component-files.ts`——4 个组件的 `files` 数组遗漏了实际存在且被公开导出/跨组件引用的 `.vue` 文件。这些遗漏通过 CLI 安装链路和跨组件导入链波及了 `data-table`（依赖 popover 的遗漏文件）和 `calendar`（依赖 tooltip 的遗漏文件），导致用户通过 CLI 安装这些组件后运行时报错。

`packages/cli` 的 Medium 问题集中在核心功能缺陷：命令注入风险、自定义 registry 被阻止、事务回滚失效、`--path` 模式 snippets 写入错误目录。

`packages/registry` 的问题主要集中在构建脚本的 locale 处理链路和正则重写的过度匹配，当前均未被触发但构成潜在风险。

---

## 二、Critical 级别问题（4 项，均在 shared 包）

以下 4 个 bug 根因相同：`component-files.ts` 中 `files` 数组遗漏了 UI 包目录中实际存在的文件，且注册表构建脚本的自动发现机制只能沿种子文件的 `./X` 导入正向追踪，无法发现"被子组件导入的根组件"或"独立并行组件"。

### C1: `tabs` 组件缺失主入口文件 `Tabs.vue`

- **文件**：[packages/shared/src/component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-files.ts#L38) L38
- **类别**：数据一致性 / 注册表逻辑
- **问题描述**：`tabs` 的 `files` 数组为 `['TabsContent.vue', 'TabsList.vue', 'TabsTrigger.vue', 'tabs-variants.ts', 'types.ts']`，遗漏了主入口 `Tabs.vue`。`Tabs.vue` 是用户实际导入的根组件，内部导入 TabsList/TabsTrigger/TabsContent（而非反向），因此自动发现机制无法捕获。已验证 `Tabs.vue` 还跨组件导入了 `../card/Card.vue` 和 `../result/Result.vue`，这些跨组件依赖也因此不会被扫描到。
- **触发条件**：用户通过 CLI 执行 `brutx-vue add tabs` 时，安装的文件不含 `Tabs.vue`，组件无法使用。同时 `tabs` 的 `registryDependencies` 缺失 `card` 和 `result`。
- **建议修复**：
  ```ts
  tabs: { files: ['Tabs.vue', 'TabsContent.vue', 'TabsList.vue', 'TabsTrigger.vue', 'tabs-variants.ts', 'types.ts'], composables: ['useLocale.ts'] },
  ```

### C2: `popover` 组件缺失 `Popover.vue`、`PopoverTrigger.vue` 和 `index.ts`

- **文件**：[packages/shared/src/component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-files.ts#L30) L30
- **类别**：数据一致性 / 注册表逻辑 / 跨包一致性
- **问题描述**：`popover` 的 `files` 数组仅为 `['PopoverContent.vue', 'popover-variants.ts']`，遗漏了 `Popover.vue`、`PopoverTrigger.vue` 和 `index.ts`。`Popover.vue` 仅从 `reka-ui` 导入，`PopoverContent.vue` 不反向导入 `Popover.vue`，因此自动发现无法捕获。

  **波及影响**：已验证 `data-table/DataTableColumnFilter.vue` L13-14 跨组件导入了 `../popover/Popover.vue` 和 `../popover/PopoverTrigger.vue`。构建脚本将其重写为 `@/components/ui/popover/Popover.vue` 和 `@/components/ui/popover/PopoverTrigger.vue`，并将 `popover` 添加到 `data-table` 的 `registryDependencies`。但 `popover` 注册表项不含这两个文件，用户安装 `data-table` 时这两个导入目标文件不存在，运行时报错。
- **触发条件**：
  1. `brutx-vue add popover` → 缺少 `Popover.vue` 和 `PopoverTrigger.vue`，组件不完整。
  2. `brutx-vue add data-table` → `DataTableColumnFilter.vue` 的导入目标不存在，运行时报错。
- **建议修复**：
  ```ts
  popover: { files: ['Popover.vue', 'PopoverTrigger.vue', 'PopoverContent.vue', 'popover-variants.ts', 'index.ts'] },
  ```

### C3: `tooltip` 组件缺失 `TooltipProvider.vue`

- **文件**：[packages/shared/src/component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-files.ts#L41) L41
- **类别**：数据一致性 / 注册表逻辑 / 跨包一致性
- **问题描述**：`tooltip` 的 `files` 数组仅为 `['TooltipContent.vue', 'tooltip-variants.ts']`，遗漏了 `TooltipProvider.vue`。`TooltipProvider.vue` 已从 UI 主入口 `index.ts` L79 公开导出，文档明确标注为"必需的祖先组件"。`TooltipContent.vue` 不导入 `TooltipProvider`，自动发现无法捕获。

  **波及影响**：已验证 `calendar/Calendar.vue` L5 跨组件导入了 `../tooltip/TooltipProvider.vue`。构建脚本将其重写为 `@/components/ui/tooltip/TooltipProvider.vue`，并将 `tooltip` 添加到 `calendar` 的 `registryDependencies`。但 `tooltip` 注册表项不含 `TooltipProvider.vue`，用户安装 `calendar` 时该导入目标文件不存在，运行时报错。
- **触发条件**：
  1. `brutx-vue add tooltip` → 缺少文档明确要求的 `TooltipProvider.vue`。
  2. `brutx-vue add calendar` → `Calendar.vue` 的导入目标不存在，运行时报错。
- **建议修复**：
  ```ts
  tooltip: { files: ['TooltipProvider.vue', 'TooltipContent.vue', 'tooltip-variants.ts'] },
  ```

### C4: `chat-bubble` 组件缺失 `ChatContainer.vue`

- **文件**：[packages/shared/src/component-files.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-files.ts#L67) L67
- **类别**：数据一致性 / 注册表逻辑
- **问题描述**：`chat-bubble` 的 `files` 数组仅为 `['ChatBubble.vue', 'chat-bubble-variants.ts']`，遗漏了 `ChatContainer.vue`。`ChatContainer.vue` 已从 UI 主入口 `index.ts` L304 公开导出。`ChatContainer.vue` 内部导入 `ChatBubble.vue`（而非反向），因此 `ChatBubble.vue` 不会触发对 `ChatContainer.vue` 的自动发现。
- **触发条件**：`brutx-vue add chat-bubble` → 缺少 `ChatContainer.vue`，无法使用该导出组件。
- **建议修复**：
  ```ts
  'chat-bubble': { files: ['ChatBubble.vue', 'ChatContainer.vue', 'chat-bubble-variants.ts'] },
  ```

---

## 三、Medium 级别问题（11 项）

### CLI 包（5 项）

#### M1: `matchFileByPath` 使用 `endsWith` 导致假阳性匹配

- **文件**：[packages/cli/src/lib/services/diff-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/diff-service.ts#L19-L25) L19-L25
- **类别**：逻辑错误
- **问题描述**：`matchFileByPath` 使用 `normalizedRegistry.endsWith('/' + normalizedLocal)` 匹配 registry 路径与本地相对路径。`localRelativePath` 是相对于组件目录的路径（如 `Button.vue`），`registryPath` 是完整路径（如 `components/ui/button/Button.vue`）。当组件含嵌套同名文件时（如 `Button.vue` 和 `icons/Button.vue`），`endsWith('/Button.vue')` 会将根目录文件错误匹配到嵌套 registry 路径，`find()` 返回第一个匹配项导致 diff 比较错误文件。
- **触发条件**：组件在 registry 中有嵌套同名文件，运行 `brutx-vue diff` 时匹配错误。
- **建议修复**：从 registry 路径中剥离组件前缀后做严格相等比较。

#### M2: `--path` 模式下 VS Code snippets 写入错误目录

- **文件**：[packages/cli/src/commands/add.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts#L278-L284) L278-L284
- **类别**：逻辑错误
- **问题描述**：当用户使用 `--path` 选项时，组件文件写入 `targetCwd`（L144: `path.resolve(cwd, options.path)`），但 VS Code snippets 的检测（L279: `hasVscodeDir(cwd)`）和写入（L282: `mergeSnippetsFile(cwd, added)`）都使用原始 `cwd` 而非 `targetCwd`，导致 snippets 写入错误目录。
- **触发条件**：`brutx-vue add button --path ./sub-project`，组件写入 `./sub-project/`，但 snippets 写入当前工作目录。
- **建议修复**：将 L279 和 L282 的 `cwd` 改为 `targetCwd`。

#### M3: `create` 命令 `projectName` 未做安全过滤，潜在命令注入

- **文件**：[packages/cli/src/commands/create.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/create.ts#L68-L100) L68-L100
- **类别**：安全
- **问题描述**：`scaffoldProject` 将 `projectName` 直接作为 spawn 参数。Windows 下 `runCommand` 使用 `shell: true`，此时参数会通过 shell 解释。`projectName` 从 CLI 参数获取，未经任何过滤。若包含 shell 元字符（`&`、`|`、`;`、反引号等），可能触发额外命令执行。对比 `package-manager.ts` L12-14 的 `sanitizePackageName` 对包名做了字符过滤，`create.ts` 缺少同等防护。
- **触发条件**：Windows 上运行 `brutx-vue create "foo & calc.exe"`，`&` 被 shell 解释为命令分隔符。
- **建议修复**：在 `create` 入口处对 `projectName` 进行校验（仅允许字母、数字、`-`、`_`），或复用 `sanitizePackageName` 防御逻辑。

#### M4: Nuxt 配置写入失败后事务仍提交，文件损坏无法回滚

- **文件**：[packages/cli/src/lib/services/init-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L205-L257) L205-L257
- **类别**：错误处理
- **问题描述**：`configureNuxtConfig` 的 catch 块吞掉写入异常并返回 `{ status: 'write-failed' }`。但 `initializeProjectFiles` 未检查 `nuxt.status`，直接调用 `transaction.commit()`。`transaction.writeFile` 在写入前已快照原文件；若写入中途抛异常（磁盘满、权限问题），文件可能处于部分写入的损坏状态。由于异常被吞，`initializeProjectFiles` 的 catch 块不会触发 `rollback()`，而是执行 `commit()` 清理快照，导致损坏文件无法恢复。
- **触发条件**：Nuxt 项目初始化时 `nuxt.config` 写入中途失败。
- **建议修复**：在 `initializeProjectFiles` 中检查 `nuxt.status === 'write-failed'` 时抛出异常以触发回滚；或移除 `configureNuxtConfig` 中的 catch，让异常直接传播。

#### M5: `validateComponents` 阻止自定义 registry 组件的安装和更新

- **文件**：[packages/cli/src/commands/add.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts#L47-L62) L47-L62（调用点 L161）
- **类别**：用户输入校验
- **问题描述**：`validateComponents` 将组件名与 `AVAILABLE_COMPONENTS`（来自 `brutx-shared-vue`，即默认 registry 的组件列表）做白名单校验。当用户通过 `--registry` 指定自定义 registry 且该 registry 包含默认列表之外的组件时，`validateComponents` 会拒绝这些组件。`update.ts` L131-139 通过调用 `add` 执行更新，已安装的自定义组件也会被拒绝。
- **触发条件**：`brutx-vue add my-custom-component --registry https://my-registry.com`，若 `my-custom-component` 不在 `AVAILABLE_COMPONENTS` 中则报错退出。
- **建议修复**：当指定了 `--registry`（非默认 registry）时跳过白名单校验；或从指定 registry 动态获取可用组件列表。

### Registry 包（4 项）

#### M6: `rewriteImports` 的 `./` 重写正则作用于整个文件内容

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L277-L280) L277-L280
- **类别**：构建逻辑
- **问题描述**：`rewriteImports` 最后一步使用正则 `/(['"])\.\/([^'"]+)\1/g` 重写所有以 `./` 开头的引号字符串。该正则作用于整个文件内容（包括 `<template>`、`<style>`、`<script>` 全部内容），而非仅作用于 import 语句。任何引号包裹的 `./` 开头字符串都会被重写，例如 CSS 中的 `url('./font.woff')`、脚本中的 `const p = './config.json'`、模板属性字符串等。
- **触发条件**：组件源码中存在非 import 用途的、以 `./` 开头的引号字符串字面量。当前未触发（已验证无 `url('./...')` 模式）。
- **建议修复**：将 `./` 重写改为仅作用于 import/export 语句的模块说明符，或先通过 `extractScriptBlocks` 提取脚本块再匹配。

#### M7: Locale 文件在 `run()` 中未通过 `rewriteImports` 处理

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L683-L694) L683-L694
- **类别**：构建逻辑
- **问题描述**：`run()` 函数构建 `locale-zh-cn.json` 时，locale 文件通过 `readComponentSource(localePath)` 读取后直接推入 `localeFiles`，未调用 `rewriteImports`。而 `computeSourceHash`（L222）对 locale 文件调用了 `rewriteImports`。这导致：哈希基于重写后的内容计算，但发布的 JSON 包含未重写的原始内容。当前 `zh-CN.ts` 仅导入 `./types`（同目录），消费者恰好能解析。但如果 locale 文件未来导入 `../composables/useLocale` 或 `../lib/env`，相对路径不会被重写为 `@/` 别名，导致消费者项目中导入路径断裂。
- **触发条件**：locale 文件添加对 `../composables/`、`../lib/`、`../components/` 的导入。当前未触发。
- **建议修复**：在 L686 后添加 `const code = rewriteImports(readComponentSource(localePath), 'locale', 'locale');`，与 `computeSourceHash` 保持一致。

#### M8: `buildRegistryItem` 不处理 locale 文件的传递依赖

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L542-L655) L542-L655
- **类别**：构建逻辑
- **问题描述**：`buildRegistryItem` 收集了 `localeDeps`（L552, L574, L600），但仅用于在 L612-614 判断是否添加 `locale-zh-cn` 到 `registryDependencies`，从不读取或解析 locale 文件本身。这意味着 locale 文件的传递依赖（如 locale 导入的 composable 或 lib）不会被包含到组件的 files 列表中。而 `computeSourceHash`（L214-229）会读取 locale 文件并提取其传递依赖。两者行为不一致。
- **触发条件**：locale 文件导入了某个 composable 或 lib，且该 composable/lib 未被组件的其他文件直接引用。当前未触发。
- **建议修复**：在 `buildRegistryItem` 中添加对 locale 文件的读取和依赖提取逻辑（与 `computeSourceHash` L214-229 对齐）。

#### M9: `computeSourceHash` 不动点迭代顺序导致 locale 引用的 composable 未被处理

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L189-L240) L189-L240
- **类别**：逻辑错误
- **问题描述**：`computeSourceHash` 的处理顺序为：组件文件 → 指令 → composables（L207-212 while 循环）→ locales（L214-229 while 循环）→ libs。在 locales 的循环中（L224），如果 locale 文件导入了 composable，该 composable 会被添加到 `composableDeps`。但 composables 的 while 循环已结束，新发现的 composable 永远不会被 `addComposableFile` 处理，其内容不会包含在哈希中。这会导致 composable 文件变更后哈希不变，触发缓存复用过期的构建产物。
- **触发条件**：locale 文件导入某个 composable，且该 composable 未被组件的其他文件直接引用。当前未触发。
- **建议修复**：将 composables 和 locales 的处理合并为单一不动点迭代循环，或在 locales 循环结束后再次执行 composables 循环。

### Shared 包（2 项）

#### M10: `COMPONENTS_BY_CATEGORY` 包含 block 组件，造成分类数据混淆

- **文件**：[packages/shared/src/component-registry.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts#L159-L181) L159-L181
- **类别**：数据一致性
- **问题描述**：`createComponentsByCategory()` 遍历全部 `COMPONENT_REGISTRY` 条目（包括 `kind: 'block'`），按 `category` 分组。导致 block 组件出现在非 block 的分类组中：`auth-card`、`dashboard-shell` 被归入 `layout`；`brutalist-hero`、`pricing-section`、`header-section`、`footer-section`、`feedback-form`、`cookie-consent` 被归入 `marketing`。Block 组件有独立的 sidebar 分组体系，与 `ComponentCategory` 正交。将 block 混入会导致依赖该映射列举"组件"（非 block）的消费者得到错误结果。
- **触发条件**：消费者使用 `COMPONENTS_BY_CATEGORY` 或 `getComponentsByCategory()` 列举某分类下的组件时，错误包含 block 组件。
- **建议修复**：在 `createComponentsByCategory` 遍历中过滤掉 `kind: 'block'` 的条目。

#### M11: `getComponentsByCategory` 返回可变共享数组引用

- **文件**：[packages/shared/src/component-registry.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts#L98-L100) L98-L100
- **类别**：数据结构
- **问题描述**：`getComponentsByCategory` 直接返回 `COMPONENTS_BY_CATEGORY[category]`（同一引用），未做拷贝。`COMPONENTS_BY_CATEGORY` 作为命名导出也直接暴露。任何调用方对返回值执行 `push`/`sort`/`splice` 等变异操作都会污染全局共享状态，影响所有其他消费者。
- **触发条件**：调用方对返回值进行变异操作。
- **建议修复**：返回前做浅拷贝：`return [...COMPONENTS_BY_CATEGORY[category]]`。

---

## 四、Low 级别问题（19 项）

### CLI 包（8 项）

#### L1: `extractDependencies` 仅扫描顶层文件，遗漏嵌套目录中的依赖

- **文件**：[packages/cli/src/lib/installed-components.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/installed-components.ts#L28-L52) L28-L52
- **类别**：逻辑错误
- **问题描述**：`extractDependencies` 使用 `fs.readdir` 读取目录后 `if (!file.isFile()) continue;` 跳过所有子目录，仅扫描顶层文件的 import。同文件中的 `scanComponentFiles`（L7-L26）是递归遍历的，两者不一致。组件有嵌套目录结构时，嵌套文件中的依赖不会被提取。
- **触发条件**：组件包含嵌套目录且有 `.vue`/`.ts`/`.js` 文件，且 manifest 中无该组件的 `dependencies` 记录。
- **建议修复**：改为递归遍历，或直接调用 `scanComponentFiles` 获取所有文件再提取依赖。

#### L2: `removeComponents` 文件计数仅统计顶层文件

- **文件**：[packages/cli/src/lib/services/remove-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/remove-service.ts#L294-L305) L294-L305（`countComponentFiles` L233-L247 同样问题）
- **类别**：逻辑错误
- **问题描述**：`const fileCount = entries.filter(e => e.isFile()).length;` 仅统计组件目录下的顶层文件，不递归计算子目录中的文件。`transaction.remove(componentPath)` 实际会递归删除整个目录，但报告给用户的 `fileCount` 和 `totalRemoved` 不准确。
- **触发条件**：删除包含嵌套目录的组件时，报告的文件数小于实际删除数。
- **建议修复**：递归统计目录下所有文件。

#### L3: `injectNuxtConfig` 的 `hasComponents`/`hasCss` 正则会匹配注释和嵌套对象

- **文件**：[packages/cli/src/lib/services/init-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L140-L145) L140-L145
- **类别**：逻辑错误
- **问题描述**：`/\bcomponents\s*:/.test(content)` 对整个文件内容做全局正则匹配，会匹配到注释中的 `components:`、嵌套对象中的 `components:`（如 `module: { components: [...] }`）、字符串字面量中的文本。若存在此类匹配但 `defineNuxtConfig` 顶层未配置，函数会错误地认为已配置并跳过注入。
- **触发条件**：`nuxt.config.ts` 中包含注释或嵌套对象中有 `components:` 键，但顶层未设置。
- **建议修复**：将检测范围限制在 `defineNuxtConfig` 的根对象块内，或使用 AST 解析。

#### L4: `BRUTX_NO_CACHE` 环境变量设置后不清除，产生全局副作用

- **文件**：[packages/cli/src/commands/add.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/add.ts#L146-L148) L146-L148（`update.ts` L11-13 同样问题）
- **类别**：状态/副作用
- **问题描述**：`if (options.cache === false) { process.env.BRUTX_NO_CACHE = '1'; }` 设置全局环境变量后从不清除。在同一进程中多次调用 `add` 时（如 `update.ts` L131-139 的循环），第一次设置后对所有后续调用持续生效。`registry.ts` L59 和 L226 通过 `process.env.BRUTX_NO_CACHE !== '1'` 检查此变量。
- **触发条件**：`update` 命令设置 `BRUTX_NO_CACHE=1` 后循环调用 `add`，所有 `add` 调用都受影响。
- **建议修复**：改为将 `useCache` 作为参数传递到 `resolveDeps`/`getItem`；或在函数结束时 `delete process.env.BRUTX_NO_CACHE`。

#### L5: CSS marker 正则硬编码字符串而非使用已导入的常量

- **文件**：[packages/cli/src/lib/services/init-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/init-service.ts#L93) L93
- **类别**：依赖配置
- **问题描述**：`const markerPattern = /\/\* brutx-ui:start \*\/[\s\S]*?\/\* brutx-ui:end \*\//;` 硬编码了 marker 字符串。文件顶部 L7-L8 已导入 `BRUTX_CSS_START_MARKER` 和 `BRUTX_CSS_END_MARKER` 常量，但 L93 未使用它们。若常量值变更，正则不会同步更新。
- **触发条件**：修改 `constants.ts` 中的 marker 常量值后，`addBrutalistStyles` 的 marker 替换逻辑失效。
- **建议修复**：使用 `new RegExp(escapeRegex(BRUTX_CSS_START_MARKER) + '[\\s\\S]*?' + escapeRegex(BRUTX_CSS_END_MARKER))` 构造正则。

#### L6: `info` 命令状态判断存在不可达代码分支

- **文件**：[packages/cli/src/commands/info.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/info.ts#L66-L78) L66-L78
- **类别**：逻辑错误
- **问题描述**：`getItem` 在失败时总是抛异常，从不返回 null。因此当 `registryItem` 为 null 时，`registryFetchError` 必然已设置。分支 3（L70）已覆盖"`registryItem` 为 null 且 `localFiles.length > 0`"的所有情况，L72 的 `else if (localFiles.length > 0)` 在该路径下永远不可能为真，属于死代码。
- **触发条件**：不会触发。
- **建议修复**：删除 L72-L73 的不可达分支，或调整分支顺序以处理 `getItem` 返回 null 的理论情况。

#### L7: `doctor` 命令报告在修复前打印，显示的是修复前状态

- **文件**：[packages/cli/src/commands/doctor.ts](file:///e:/project/brutxui-vue3/packages/cli/src/commands/doctor.ts#L546-L554) L546-L554
- **类别**：逻辑错误
- **问题描述**：`doctor` 函数先打印报告（L546-L550），再执行修复（L552-L553: `applyFixes`）。`applyFixes` 内部将已修复的 `check.status` 改为 `'pass'`，但此时报告已输出。用户看到的是修复前状态，`--json` 模式下 JSON 输出也是修复前状态，可能误导自动化工具。
- **触发条件**：运行 `brutx-vue doctor --fix`，报告显示错误/警告，修复实际执行成功，但报告未反映修复结果。
- **建议修复**：在 `applyFixes` 完成后重新打印报告，或将报告输出移到修复之后。

#### L8: `diffComponent` 静默吞掉 registry 获取错误

- **文件**：[packages/cli/src/lib/services/diff-service.ts](file:///e:/project/brutxui-vue3/packages/cli/src/lib/services/diff-service.ts#L121-L125) L121-L125
- **类别**：错误处理
- **问题描述**：`try { registryItem = await getItem(...); } catch { registryItem = null; }` 完全吞掉异常，不记录错误信息。对比 `info.ts` L56-61 的同类代码会捕获 `registryFetchError` 并用于设置 `registry-unreachable` 状态。`diffComponent` 无法区分"组件不存在"与"registry 网络不可达"，统一返回 `local-only` 或 `not-installed`。
- **触发条件**：网络不通时运行 `brutx-vue diff button`，输出显示 `local-only` 而非提示 registry 不可达。
- **建议修复**：参考 `info.ts` 捕获错误，在 `DiffResult` 中增加 `registryError` 字段或 `registry-unreachable` 状态。

### Registry 包（9 项）

#### L9: Directive 到 directive 的依赖未追踪

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L195-L206) L195-L206（`buildRegistryItem` L589-L608 同样问题）
- **类别**：构建逻辑
- **问题描述**：处理 directive 文件时，代码提取了 `composables`、`locales`、`lib` 依赖，但从未调用 `extractDeps(code, 'directives')` 提取其他 directive 依赖。已通过 Grep 确认 `extractDeps(.*'directives')` 在整个代码库中零调用。
- **触发条件**：一个 directive 文件导入另一个 directive 文件。当前未触发（`loading.ts` 仅导入 `../lib/env` 和 `../components/spinner/Spinner.vue`）。
- **建议修复**：添加 `extractDeps(code, 'directives')` 逻辑并迭代处理。

#### L10: `extractDeps`/`extractComponentFileDeps` 对无扩展名导入假设 `.ts` 扩展名

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L292-L294) L292-L294（`extractComponentFileDeps` L383-385 同样问题）
- **类别**：构建逻辑
- **问题描述**：当导入说明符无扩展名时，代码通过 `path.extname(rawFileName) ? rawFileName : \`${rawFileName}.ts\`` 自动追加 `.ts`。但对于 `.vue` 文件的无扩展名导入（如 `@/components/ui/button/Button`），会错误推断为 `Button.ts` 而非 `Button.vue`，导致文件查找失败。
- **触发条件**：存在无扩展名的 `.vue` 文件导入。当前未触发（组件源码中 `.vue` 导入均带扩展名）。
- **建议修复**：推断扩展名时先检查 `.ts` 和 `.vue` 两个候选文件是否存在，优先匹配实际存在的文件。

#### L11: `extractStaticModuleSpecifiers` 不处理反引号模板字面量

- **文件**：[packages/registry/scripts/validate-utils.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L393-L402) L393-L402
- **类别**：校验逻辑
- **问题描述**：`extractStaticModuleSpecifiers` 使用正则仅匹配单引号和双引号，不匹配反引号。虽然 ES 规范不允许静态 import/export 使用模板字面量，但该函数也用于校验已发布的 JSON 内容，可能漏检。
- **触发条件**：注册表文件内容中存在反引号包裹的模块说明符。当前未触发。
- **建议修复**：由于静态 import/export 语法上不允许模板字面量，此函数行为符合规范。建议在注释中明确说明此限制。

#### L12: 排序方式不一致——`localeCompare` vs 默认 `sort()`

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L76) L76 与 [packages/registry/scripts/validate-utils.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L166) L166
- **类别**：校验逻辑
- **问题描述**：`buildRegistryManifest` 使用 `a.name.localeCompare(b.name)` 排序，`validateRegistryManifestConsistency` 使用默认 `sort()` 验证排序。默认 `sort()` 按 UTF-16 码点排序，`localeCompare` 按区域设置排序。对于包含非 ASCII 字符或大小写混合的名称，两者可能产生不同顺序，导致校验误报。
- **触发条件**：组件名称包含非 ASCII 字符或大小写混合导致排序不同。当前未触发（所有组件名为小写 ASCII kebab-case）。
- **建议修复**：统一使用同一种排序方式。

#### L13: `computeSourceHash` 静默跳过缺失文件，`buildRegistryItem` 抛出异常——处理不一致

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L219-L234) L219, L234 vs L564, L592, L621
- **类别**：错误处理
- **问题描述**：`computeSourceHash` 对缺失的 locale 文件（L219: `if (fs.existsSync(localePath))`）和 lib 文件（L234）静默跳过。而 `buildRegistryItem` 对缺失的组件文件（L564）、directive 文件（L592）、lib 文件（L621）均抛异常。这种不一致可能导致：哈希计算成功（跳过缺失文件），但实际构建失败（抛异常），使得缓存中存储了一个永远无法匹配的哈希值。
- **触发条件**：`COMPONENT_FILES` 中声明了不存在的 lib 或 locale 文件路径。当前未触发。
- **建议修复**：统一错误处理策略，建议 `computeSourceHash` 也对缺失文件抛出异常。

#### L14: `extractModuleSpecifiers` 不处理动态 `import()` 表达式

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L299-L324) L299-L324
- **类别**：构建逻辑
- **问题描述**：`extractModuleSpecifiers` 仅检查 `ts.isImportDeclaration` 和 `ts.isExportDeclaration`，不检查 `ts.isCallExpression` 中的动态 `import('...')` 表达式。如果组件使用动态导入（如 `const mod = await import('@/composables/useFoo')`），该依赖不会被提取。
- **触发条件**：组件源码使用动态 `import()` 导入内部模块。当前未触发。
- **建议修复**：添加对 `ts.isCallExpression` 的检查，识别 `import(...)` 调用并提取其字符串字面量参数。

#### L15: `rewriteImports` 前 3 个正则用 `['"]` 无反向引用，可能匹配混合引号

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L251-L253) L251-L253
- **类别**：逻辑错误
- **问题描述**：前 3 个重写正则使用 `['"]...['"]` 匹配引号，未使用反向引用确保首尾引号一致。例如 `/['"]\.\.\/composables\/([^'"]+)['"]/g` 会匹配 `"../composables/useFoo'`（首双尾单）。后续的 L262-265 和 L277-280 正确使用了反向引用 `(['"])...\1`，但前 3 个没有。
- **触发条件**：源码中存在首尾引号不一致的导入路径字符串字面量。在实际 TypeScript/Vue 代码中极罕见（编译器会报错）。
- **建议修复**：为一致性，将前 3 个正则也改为使用反向引用。

#### L16: `validateRegistryItemInternalImports` 不验证跨组件导入是否声明在 `registryDependencies` 中

- **文件**：[packages/registry/scripts/validate-utils.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/validate-utils.ts#L365-L429) L365-L429
- **类别**：校验逻辑
- **问题描述**：`validateRegistryItemInternalImports` 对 `@/components/ui/{otherComponent}/...`（跨组件）导入返回 `null`（L428），导致这些导入完全不参与校验。代码不验证跨组件导入是否已声明在 `registryDependencies` 中。在缓存复用路径中，如果缓存的 JSON 被手动编辑导致 `registryDependencies` 缺失某个跨组件依赖，校验不会发现。
- **触发条件**：缓存的注册表 JSON 被手动编辑，或 `extractRegistryDeps` 逻辑出现回归。当前未触发。
- **建议修复**：添加对跨组件导入的校验——提取 `@/components/ui/{depName}/` 导入，验证 `depName` 在 `registryDependencies` 中。

#### L17: `utils.ts` 被排除后其传递依赖不被追踪

- **文件**：[packages/registry/scripts/build-registry.ts](file:///e:/project/brutxui-vue3/packages/registry/scripts/build-registry.ts#L39) L39（`buildRegistryItem` L616-617、`computeSourceHash` L232 同样问题）
- **类别**：构建逻辑
- **问题描述**：`utils.ts` 被 `LIB_FILE_EXCLUDE` 排除，在 `buildRegistryItem`（L617）和 `computeSourceHash`（L232）中遇到时直接 `continue` 跳过，不读取/解析文件内容。如果 `utils.ts` 未来导入了其他内部 lib 文件，这些传递依赖不会被自动发现和包含。当前 `utils.ts` 仅导入外部包（`clsx`、`tailwind-merge`），无内部依赖。
- **触发条件**：`utils.ts` 添加对内部 lib 文件的导入。当前未触发。
- **建议修复**：即使排除 `utils.ts` 的内容发布，仍应读取并解析其导入以发现传递依赖；或在注释中明确记录 `utils.ts` 不得有内部依赖。

### Shared 包（2 项）

#### L18: `COMPONENT_REGISTRY` 构造时数组引用共享

- **文件**：[packages/shared/src/component-registry.ts](file:///e:/project/brutxui-vue3/packages/shared/src/component-registry.ts#L112-L120) L112-L120
- **类别**：数据结构
- **问题描述**：构造 registry 条目时使用 `...meta` 和 `...fileMapping` 展开运算符，会按引用复制 `dependencies`、`files`、`composables`、`directives` 等数组。因此 `COMPONENT_REGISTRY[name].dependencies === COMPONENTS[name].dependencies`（同一数组对象）。对任一方的变异会影响另一方。
- **触发条件**：任何代码变异 `COMPONENT_REGISTRY[name].dependencies`（或 files/composables/directives）时，会同时修改源数据。
- **建议修复**：对数组字段做浅拷贝，例如 `dependencies: [...meta.dependencies]`。

#### L19: 非 block 的 `marketing` 分类组件会在侧边栏中成为孤儿

- **文件**：[packages/shared/src/sidebar-generator.ts](file:///e:/project/brutxui-vue3/packages/shared/src/sidebar-generator.ts#L154-L165) L154-L165（`generateComponentsSidebar` L208-L224）
- **类别**：侧边栏生成 / 逻辑错误（潜在）
- **问题描述**：`DEFAULT_CATEGORY_TO_SIDEBAR_GROUP` 将 `marketing` 分类映射到 `blocks-sections` sidebar 分组。但 `blocks-sections` 不在 `COMPONENT_GROUP_ORDER` 中（该常量只包含非 block 的 10 个分组）。`generateComponentsSidebar` 过滤 `kind !== 'block'` 的组件后，按 `COMPONENT_GROUP_ORDER` 构建分组。如果一个非 block 组件的分类为 `marketing`（且无显式 `sidebarGroup`），其 `resolveSidebarGroup` 返回 `blocks-sections`，该分组不在 `COMPONENT_GROUP_ORDER` 中，组件会被静默丢弃。
- **触发条件**：添加一个非 block 组件，其分类解析为 `marketing` 且无显式 `sidebarGroup`。当前未触发（所有 `marketing` 分类组件都是 block）。
- **建议修复**：在 `generateComponentsSidebar` 中对未被任何分组捕获的组件添加 fallback 分组；或将 `marketing` 映射改为某个非 block 分组。

---

## 五、修复优先级建议

### P0（立即修复——影响核心功能）

| Bug | 文件 | 简述 | 影响 |
|-----|------|------|------|
| C1 | `shared/src/component-files.ts` L38 | `tabs` 缺失 `Tabs.vue` | CLI 安装 tabs 后无法使用 |
| C2 | `shared/src/component-files.ts` L30 | `popover` 缺失 `Popover.vue`/`PopoverTrigger.vue` | CLI 安装 popover/data-table 后运行时报错 |
| C3 | `shared/src/component-files.ts` L41 | `tooltip` 缺失 `TooltipProvider.vue` | CLI 安装 tooltip/calendar 后运行时报错 |
| C4 | `shared/src/component-files.ts` L67 | `chat-bubble` 缺失 `ChatContainer.vue` | CLI 安装 chat-bubble 后组件不完整 |

> **修复方式**：在 `component-files.ts` 对应条目的 `files` 数组中补全遗漏文件，然后重新构建 registry。

### P1（尽快修复——安全风险或功能缺陷）

| Bug | 文件 | 简述 | 影响 |
|-----|------|------|------|
| M3 | `cli/src/commands/create.ts` | `projectName` 命令注入 | Windows 下潜在命令执行 |
| M5 | `cli/src/commands/add.ts` | `validateComponents` 阻止自定义 registry | 自定义 registry 功能不可用 |
| M4 | `cli/src/lib/services/init-service.ts` | Nuxt 配置写入失败无法回滚 | 初始化时配置文件损坏 |
| M2 | `cli/src/commands/add.ts` | `--path` 模式 snippets 写错目录 | snippets 写入错误目录 |

### P2（计划修复——边界 bug 和构建脚本隐患）

- M1（diff 假阳性匹配）、M6-M9（registry 构建脚本 locale/正则问题）、M10-M11（shared 数据结构）
- L1-L19 中的所有 Low 级别问题

---

## 六、附录：审查文件清单

### CLI 包（20 个源码文件）
`api.ts`、`index.ts`、`commands/{add,create,diff,doctor,info,init,list,remove,update}.ts`、`lib/{cache,constants,error-advice,error,file-transaction,index,installed-components,logger,manifest,package-manager,project,registry,types,vscode-snippets}.ts`、`lib/services/{add-service,diff-service,init-service,remove-service,index}.ts`、`types/diff.d.ts`、`package.json`、`tsconfig.json`、`tsup.config.ts`

### Registry 包（6 个源码文件）
`scripts/{build-registry,validate-registry,validate-utils,component-files}.ts`、`package.json`、`tsconfig.json`

### Shared 包（9 个源码文件）
`src/{component-files,component-registry,components,index,registry,sidebar-generator,types}.ts`、`package.json`、`tsconfig.json`
