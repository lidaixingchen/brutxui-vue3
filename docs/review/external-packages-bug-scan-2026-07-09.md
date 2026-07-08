# Bug 扫描报告：`packages/` 之外

- **扫描日期：** 2026-07-09
- **扫描范围：** `apps/docs`、`scripts`、`templates`、`.github/workflows` 及根配置文件（不含 `packages/`）
- **方法：** 三个并行 agent 分别扫描 VitePress 配置/主题核心、构建脚本/CI/模板、Demo 组件；关键结论逐文件复核（publish.yml、.npmrc、Toggle.vue、config.ts transformHead 均已确认属实）

---

## 严重 (Critical)

### 1. `publish.yml` — 发布步骤缺少 `NODE_AUTH_TOKEN`，且 `||` 吞掉所有错误

**文件：** [publish.yml](file:///e:/project/brutxui-vue3/.github/workflows/publish.yml#L65-L71)

两个 `pnpm publish` 步骤都没有设置 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`。`setup-node@v4` 的 `registry-url` 会在 `~/.npmrc` 写入 `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`，但该环境变量从未赋值，导致认证 token 为空。更糟的是第 67/71 行的 `|| echo "::warning::...version already exists, skipped"` 会吞掉**所有**失败（认证失败、网络错误、未知错误），工作流显示绿灯但包实际未发布。结合 `release:check` 此前一直失败，这个隐患尚未暴露，但一旦测试通过就会触发。

**修复建议：** 发布步骤加 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`；并仅对 `EPUBLISHCONFLICT` 跳过，其他错误传播。

---

## 高 (High)

### 2. `.npmrc` — pnpm 11 忽略非 auth/registry 设置

**文件：** [.npmrc](file:///e:/project/brutxui-vue3/.npmrc)

`shamefully-hoist=true`、`strict-peer-dependencies=false`、`auto-install-peers=true` 在 pnpm 11（项目 `packageManager: pnpm@11.10.0`）下不再从 `.npmrc` 读取，需迁移到 `pnpm-workspace.yaml`。当前 `pnpm-workspace.yaml` 未包含这些设置，`shamefullyHoist` 默认 `false` 可能导致模块解析失败。

**修复建议：** 将三项设置迁移到 `pnpm-workspace.yaml`：
```yaml
shamefullyHoist: true
strictPeerDependencies: false
autoInstallPeers: true
```

### 3. `config.ts` — 英文首页 `transformHead` 生成错误的 canonical/hreflang

**文件：** [config.ts:137-144](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/config.ts#L137-L144)

`en/index.md` 经 `pageUrl.replace(/\/index$/, '')` 变为 `"en"`，而 `isEn = "en".startsWith("en/")` 返回 `false`（缺尾斜杠）。结果英文首页被误判为中文页：

- canonical 变 `${baseUrl}/en`（缺尾斜杠）
- hreflang en 变 `${baseUrl}/en/en`（双重 en）
- hreflang zh-CN 指向英文页

SEO 元数据全错，影响英文站搜索索引。`en/components/index.md` 等子页不受影响（`en/components` 能通过 `startsWith('en/')`）。

**修复建议：** `const isEn = pageUrl === 'en' || pageUrl.startsWith('en/')`。

### 4. `templates/vue-app/package.json` — lint 脚本引用未安装的 eslint

**文件：** [templates/vue-app/package.json:11](file:///e:/project/brutxui-vue3/templates/vue-app/package.json#L11)

`scripts.lint: eslint . --ext .vue,.ts,.tsx --fix`，但 `devDependencies` 无 `eslint`，运行 `pnpm lint` 报 command not found。且 `--ext` 在 ESLint v9+ 已废弃。

**修复建议：** 在 `devDependencies` 中添加 `eslint` 及相关插件，或移除 `lint` 脚本。

---

## 中 (Medium)

### 5. `ToggleDemo.vue` — `v-model:pressed` 绑定失效

**文件：** [ToggleDemo.vue:28](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/ToggleDemo.vue#L28)

已核对 [Toggle.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/toggle/Toggle.vue#L12-L32)：仅声明 `modelValue` prop 与 `update:modelValue` emit，**无 `pressed` prop**。`v-model:pressed="outlinePressed"` 中 `:pressed` 作为 fallthrough attr 落到 DOM，`@update:pressed` 永不触发，`outlinePressed` 永远为 `false`。同文件其他 Toggle 用 `v-model` 正确，仅此一处不一致。

视觉效果上 reka-ui 进入 uncontrolled 模式仍切换 `aria-pressed`，看似能用，但绑定契约已破坏——复制此写法到业务代码会读到永远为 `false` 的 stale 状态。

**修复建议：** 改为 `v-model="outlinePressed"`（与同文件其他 Toggle 一致）。

### 6. `LoadingDemo.vue` — `v-loading-text` 是未注册指令

**文件：** [LoadingDemo.vue:62](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/LoadingDemo.vue#L62)

`v-loading-text="''"` 被解析为名为 `loading-text` 的指令，但项目只注册了 `v-loading`。`v-loading` 实现读取的是 `el.getAttribute('loading-text')` HTML 属性，非指令 arg（见 `packages/ui/src/directives/loading.ts:40,74`）。dev 模式产生 `Failed to resolve directive: loading-text` 警告，且该行无任何效果（空字符串本就 falsy）。

**修复建议：** 删除 `v-loading-text="''"` 这一行；如需自定义文字用 `:loading-text="'文字'"`。

### 7. `CopyButton.vue` — 无错误处理/定时器清理/clipboard 可用性检查

**文件：** [CopyButton.vue:19-25](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/CopyButton.vue#L19-L25)

- `navigator.clipboard.writeText` 无 try/catch，HTTP dev 模式或权限拒绝时 `navigator.clipboard` 可能为 `undefined` 抛 TypeError，`copied` 永不置 true，用户无反馈。
- `setTimeout` 未在卸载时清理，存在内存泄漏。
- 多次点击会叠加定时器，首个定时器可能提前重置 `copied`。

对比同项目 [ThemePlayground.vue](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/ThemePlayground.vue#L164-L185) 的 `copyCss` 有完整 try/catch + `navigator.clipboard` 可用性检查 + fallback。

**修复建议：** 添加 try/catch 和 clipboard 检查；用 `onBeforeUnmount` 清理定时器；设置新定时器前清除旧的。

### 8. `templates/component/component.test.ts.hbs` — 缺少 vitest 导入

**文件：** [templates/component/component.test.ts.hbs:1](file:///e:/project/brutxui-vue3/templates/component/component.test.ts.hbs#L1)

使用 `describe`/`it`/`expect` 但未 `import`。本项目 `vitest.config.ts` 启用了 `globals: true` 所以能跑，但 CLI 生成的终端用户项目未必启用，会报 `describe is not defined`。对比 `scripts/generate.ts:256` 的模板有 `import { describe, it, expect } from 'vitest'`。

**修复建议：** 文件顶部添加 `import { describe, it, expect } from 'vitest'`。

### 9. `templates/vue-app/package.json` — 依赖版本过时

**文件：** [templates/vue-app/package.json:14-21](file:///e:/project/brutxui-vue3/templates/vue-app/package.json#L14-L21)

模板用 `vite: ^6.3.5`、`typescript: ~5.7.3`、`vue-tsc: ^2.2.10`，而项目技术栈要求 Vite 8+、TypeScript 6.0+（见 AGENTS.md，apps/docs 用 `vite: ^8.0.16`、`typescript: ^6.0.3`、`vue-tsc: ^3.3.3`）。生成项目与主项目不一致。

**修复建议：** 将模板依赖版本更新到与项目一致。

### 10. `update-visual-baselines.yml` — 视觉测试前缺少 build

**文件：** [update-visual-baselines.yml:48](file:///e:/project/brutxui-vue3/.github/workflows/update-visual-baselines.yml#L48)

运行 `pnpm --filter brutx-ui-vue test:visual:update` 前未先 `pnpm --filter brutx-ui-vue build`（对比 [ci.yml:58](file:///e:/project/brutxui-vue3/.github/workflows/ci.yml#L58) 会先构建）。若测试依赖 dist/，基线截图可能基于过时或缺失产物。

**修复建议：** 第 48 行之前添加 `- run: pnpm --filter brutx-ui-vue build`。

### 11. `apps/docs/package.json` — VitePress 1.6 与 Vite 8 不兼容

**文件：** [apps/docs/package.json:26-27](file:///e:/project/brutxui-vue3/apps/docs/package.json#L26-L27)

`vitepress: ^1.6.4` 的 peer 是 `vite: ^5.4.14`，项目用 `vite: ^8.0.16`。VitePress 1.x 不支持 Vite 8，`strictPeerDependencies: false` 不阻止安装但运行时可能构建异常。

**修复建议：** 升级到支持 Vite 8 的 VitePress 版本，或检查 VitePress 2.x 是否可用。

---

## 低 (Low)

### 12. `config.ts` — Vite `@` 别名多拼一层

**文件：** [config.ts:287](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/config.ts#L287)

`'@': resolve(import.meta.dirname, '.vitepress')`，而 `import.meta.dirname` 已是 `apps/docs/.vitepress`，解析到 `apps/docs/.vitepress/.vitepress`（不存在）。tsconfig 映射正确。当前无运行时影响（`@/` 仅在字符串字面量中）。

**修复建议：** `'@': import.meta.dirname`。

### 13. `ThemePlayground.vue` — `copyTimer` 未在卸载时清理

**文件：** [ThemePlayground.vue:50,182](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/ThemePlayground.vue#L50)

`let copyTimer` 在 `copyCss` 中通过 `setTimeout` 赋值，未 `onBeforeUnmount` 清理。组件卸载后定时器回调仍执行，尝试在已卸载组件上设置 `copyState.value`。

**修复建议：** `onBeforeUnmount(() => { if (copyTimer) clearTimeout(copyTimer) })`。

### 14. `TranslationBanner.vue` — 非响应式读取 + 脆弱 `history.back()`

**文件：** [TranslationBanner.vue:5-7,16](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/TranslationBanner.vue#L5-L7)

- `frontmatter.value.translated`/`lang.value` 在 setup 一次性读取，非响应式。当前组件在页面内容中（每次导航重新挂载）暂无问题，但移到布局中会产生过期数据。
- `href="#" onclick="history.back()"`：`history.back()` 可能跳到非中文版本；`href="#"` 在无历史记录时滚到顶部；内联 `onclick` 绕过 Vue 事件系统。

**修复建议：** 用 `computed`；导航到当前页中文版本（移除 `/en` 前缀）而非 `history.back()`。

### 15. `HomeStats.vue` — 硬编码且过时的统计值

**文件：** [HomeStats.vue:14-17](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/HomeStats.vue#L14-L17)

显示 `65+` 组件、`31+` 区块，实际 `COMPONENT_REGISTRY` 约 77 组件、8 区块。违反"禁止硬编码"规则，且当前值已不正确。

**修复建议：** 从 `COMPONENT_REGISTRY` 动态计算。

### 16. `ci.yml` — registry validate 缺前置 build

**文件：** [ci.yml:66](file:///e:/project/brutxui-vue3/.github/workflows/ci.yml#L66)

CI 仅运行 `pnpm --filter brutx-registry-vue validate`，未先 build（对比 [check-release.mjs:25-26](file:///e:/project/brutxui-vue3/scripts/release/check-release.mjs#L25-L26) 会先 build 再 validate）。若 JSON 未提交/过时，验证的是旧数据，无法检测源码与产物漂移。

**修复建议：** validate 之前添加 build 步骤。

### 17. `generate-changelog.mjs` — compare 链接 fallback 到不存在的 tag

**文件：** [generate-changelog.mjs:126](file:///e:/project/brutxui-vue3/scripts/release/generate-changelog.mjs#L126)

`latestTag || 'v0.0.0'` 在无 tag 仓库中生成 `compare/v0.0.0...HEAD`，但 `v0.0.0` tag 实际不存在，链接 404。

**修复建议：** 无 tag 时使用首个 commit SHA 作为 fallback，或省略比较链接。

### 18. `check-release.mjs` — `else` 分支死代码

**文件：** [check-release.mjs:209-213](file:///e:/project/brutxui-vue3/scripts/release/check-release.mjs#L209-L213)

`requiredCommands` 全部条目的 command 为 `'pnpm'`，`else { runCommand(command, args, options); }` 分支永不执行。

**修复建议：** 移除 else 分支。

### 19. 多个 Demo 的 timer 未清理

**文件：** [LoadingDemo.vue:10](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/LoadingDemo.vue#L10)、[CounterDemo.vue:20](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/CounterDemo.vue#L20)、[ComboboxDemo.vue:18](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/ComboboxDemo.vue#L18)、[UploadDemo.vue:68](file:///e:/project/brutxui-vue3/apps/docs/.vitepress/theme/components/demos/UploadDemo.vue#L68)

`setTimeout`/`setInterval` 未在 `onUnmounted` 清理。Vue 中通常无害 no-op；UploadDemo 的 `URL.createObjectURL` 未 revoke 有轻微内存泄漏。

---

## 汇总

| # | 文件 | 严重度 | 问题 |
|---|------|--------|------|
| 1 | publish.yml:65-71 | Critical | 缺少 `NODE_AUTH_TOKEN` + `\|\|` 吞掉所有错误 |
| 2 | .npmrc | High | pnpm 11 忽略非 auth 设置 |
| 3 | config.ts:137-144 | High | 英文首页 canonical/hreflang 全错 |
| 4 | templates/vue-app/package.json:11 | High | lint 引用未安装的 eslint |
| 5 | ToggleDemo.vue:28 | Medium | `v-model:pressed` 绑定失效 |
| 6 | LoadingDemo.vue:62 | Medium | `v-loading-text` 未注册指令 |
| 7 | CopyButton.vue:19-25 | Medium | 无错误处理/定时器清理/clipboard 检查 |
| 8 | templates/component/component.test.ts.hbs:1 | Medium | 缺少 vitest 导入 |
| 9 | templates/vue-app/package.json:14-21 | Medium | 依赖版本过时 |
| 10 | update-visual-baselines.yml:48 | Medium | 视觉测试前缺 build |
| 11 | apps/docs/package.json:26-27 | Medium | VitePress 1.6 与 Vite 8 不兼容 |
| 12 | config.ts:287 | Low | `@` 别名多拼一层 |
| 13 | ThemePlayground.vue:50,182 | Low | `copyTimer` 未清理 |
| 14 | TranslationBanner.vue:5-7,16 | Low | 非响应式读取 + 脆弱 history.back() |
| 15 | HomeStats.vue:14-17 | Low | 硬编码过时统计值 |
| 16 | ci.yml:66 | Low | registry validate 缺前置 build |
| 17 | generate-changelog.mjs:126 | Low | compare 链接 fallback 到不存在 tag |
| 18 | check-release.mjs:209-213 | Low | else 分支死代码 |
| 19 | 多个 Demo | Low | timer 未清理 |

---

## 修复优先级建议

1. **立即修：** #1（publish 认证，下次发版会静默失败）、#3（英文首页 SEO，影响线上搜索索引）
2. **尽快修：** #2（.npmrc 影响安装可靠性）、#5、#6（改动小、收益高）
3. **排期修：** 其余按严重度排期

## 已核验为「正确」的关键点

为避免误报，以下常被怀疑的用法已逐一核验无误：

- VitePress 主题核心：`theme/index.ts`、`utils.ts`、`Layout.vue`、`i18n.ts`、`theme-playground.ts`、`component-catalog.ts`、`sidebar-generator.ts`（`date-time` 分组通过显式 `sidebarGroup` 生效，非死代码）
- 主题组件：`ComponentCatalog.vue`、`ComponentPreview.vue`、`HomeComponentShowcase.vue`、`HomeCodePreview.vue`、`InstallationTabs.vue`、`Logo.vue`、`ThemeToggle.vue`
- Demo 关键用法：`DatePicker`/`ColorPicker` 的 `pickerRef.open`、`Command` 的 `filterSearch`、`Carousel` 的 scroll 方法、`DataTable` 暴露对象、`InfiniteScroll.resetLoading`、`Transfer.change` 签名、`KanbanBoard` 事件与插槽、`Tour.placement`、`Popconfirm` 属性、`Checkbox :checked="'indeterminate'"`、`Progress :model-value`、`useMessage`/`useDialog`/`useMessageBox` 调用签名、所有子路径导入（均已在 package.json exports 注册）
- 无任何 demo 导入已被移除的组件；无 SSR 顶层访问 `window`/`document`/`localStorage` 问题
