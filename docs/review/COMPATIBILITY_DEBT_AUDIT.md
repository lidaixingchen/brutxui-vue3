# 全面兼容性包袱审查报告

**项目**: brutxui-vue3 (Neo-Brutalism UI Library Monorepo)
**审查日期**: 2026-06-30
**审查范围**: `packages/` 和 `apps/` 下所有源代码

---

## 总体评估

**项目兼容性包袱极轻，代码质量优秀。** 这是一个干净的、完全基于 Vue 3 Composition API 的现代 UI 库，无 IE 支持、无 Vue 2 兼容层、无 polyfill。

### 按维度汇总

| 维度 | 严重问题 | 中等问题 | 低优先级 | 整体评价 |
|------|---------|---------|---------|---------|
| 浏览器兼容性 | 0 | 0 | 1 | 极佳 — 仅 `-moz-osx-font-smoothing` 可移除 |
| Vue 兼容性 | 0 | 0 | 1 | 极佳 — 仅 `getCurrentInstance()` 半内部 API |
| TypeScript 类型 | 0 | 0 | ~15 | 良好 — 源码无 `any`，问题在测试文件 |
| 废弃代码 | 2 | 4 | 3 | 有 dead code 待清理 |
| 依赖和构建 | 3 | 3 | 6 | Tailwind v3/v4 冲突需关注 |
| CSS 和样式 | 0 | 0 | 3 | 极佳 — 仅少量可清理项 |

### 无问题的维度（值得肯定）

- 零 polyfill — 无任何浏览器 polyfill 依赖
- 零 IE 支持代码 — 无条件注释、UA 检测、IE hack
- 零 Vue 2 兼容层 — 无 `@vue/compat`、`vue-demi`、Options API
- 零废弃 API 使用 — 无 `$listeners`、`.native`、`$set`、`Vue.extend`
- 215+ 组件统一使用 `<script setup lang="ts">`
- 源码无 `any` 类型 — 仅测试文件中有少量
- 所有 `@ts-expect-error` 均有清晰注释说明 vue-tsc 限制
- CSS 变量 fallback 设计完善 — 50+ 处使用 `var(--name, fallback)` 模式

---

## 一、浏览器兼容性审查

### 1. Polyfill / Shim / Browser Hack

**无 polyfill 或 shim。** 项目中不存在 `core-js`、`@babel/polyfill`、`regenerator-runtime` 等依赖。

### 2. CSS Vendor Prefixes

所有 vendor prefix 均合理且必要：

| 文件 | 属性 | 用途 | 是否需要保留 |
|------|------|------|-------------|
| `packages/ui/src/styles.css:57` | `-webkit-text-size-adjust: 100%` | 防止 iOS 文本膨胀 | 是 — 无标准替代 |
| `packages/ui/src/styles.css:68` | `-webkit-font-smoothing: antialiased` | macOS/WebKit 字体平滑 | 是 — 非标准属性 |
| `packages/ui/src/styles.css:69` | `-moz-osx-font-smoothing: grayscale` | Firefox/macOS 字体平滑 | 可选 — 现代 Firefox 已不需要 |
| `apps/docs/.vitepress/theme/style.css:403` | `-webkit-background-clip: text` | 渐变文字 | 是 — Safari 仍需要 |
| `apps/docs/.vitepress/theme/style.css:404` | `-webkit-text-fill-color` | 渐变文字颜色 | 是 — 非标准属性 |
| `apps/docs/.vitepress/theme/style.css:886-901` | `::-webkit-scrollbar` 系列 | 自定义滚动条 | 是 — 无标准替代 |
| `packages/ui/src/components/marquee/marquee-variants.ts:12` | `-webkit-mask-image` | 遮罩 | 可选 — 标准版已广泛支持 |

### 3. 浏览器特性检测（全部合理）

| 文件 | 代码 | 评估 |
|------|------|------|
| `composables/useAudioEngine.ts:23-35` | `webkitAudioContext` fallback | 合理 — 兼容旧版 iOS Safari |
| `composables/useClipboard.ts:7` | `navigator.clipboard?.writeText` 检测 | 合理 — 标准特性检测 |
| `composables/useColorHistory.ts:23,39` | `typeof window/localStorage` SSR 守卫 | 合理 — SSR 安全 |
| `composables/useTheme.ts` | `typeof document/localStorage` SSR 守卫 | 合理 — SSR 安全 |

### 4. 无 IE / 旧浏览器条件代码

未发现 `MSIE`、`Trident`、`document.all`、条件注释等。

---

## 二、Vue 兼容性审查

### 1. Vue 2/3 兼容层

**无。** 不存在 `@vue/compat`、`vue-demi`、`@vue/composition-api` 依赖。

### 2. Options API 混用

**无。** 全部 215+ 个组件均使用 `<script setup lang="ts">`。唯一包含双 script 块的是 `FormWizard.vue`，用于导出类型和 composable，这是 Vue 3 原生支持的特性。

### 3. Vue 2 遗留 API

| API | 状态 |
|-----|------|
| `$listeners` | 未使用 |
| `.native` 修饰符 | 未使用 |
| `$set` / `$delete` | 未使用 |
| `Vue.extend` / `Vue.observable` | 未使用 |
| `beforeDestroy` / `destroyed` | 未使用 |
| `.sync` 修饰符 | 未使用 |
| `$parent` / `$root` / `$children` | 未使用 |
| `functional: true` | 未使用 |
| `data()` / `methods: {}` | 未使用 |

### 4. 值得注意

- `useTheme.ts:170` 使用 `getCurrentInstance()` — 半内部 API，用法合理但可考虑重构
- `$slots.xxx` 在 4 个组件中用于条件渲染 — 合法的 Vue 3 用法

---

## 三、TypeScript 类型兼容性审查

### 1. 严格模式配置

所有 5 个 tsconfig 均设置 `"strict": true`。

**可选增强项：**
- `noUncheckedIndexedAccess` — 未开启
- `noPropertyAccessFromIndexSignature` — 未开启
- `exactOptionalPropertyTypes` — 未开启

### 2. `any` 类型使用（共 15 处）

**源码中无 `any`。** 所有 `any` 均在测试文件和脚本中：

| 文件 | 数量 | 说明 |
|------|------|------|
| `cli/tests/project.test.ts` | 7 | `vi.spyOn` mock 参数类型 |
| `virtual-scroll/virtual-scroll.test.ts` | 5 | `wrapper.vm as any` 访问 exposed 方法 |
| `registry/scripts/validate-registry.ts` | 3 | JSON 解析和错误处理 |
| `cli/tests/registry.test.ts` | 1 | mock 数据类型 |

### 3. `@ts-expect-error` 使用（共 3 处）

全部为 vue-tsc 已知限制，注释清晰：

| 文件 | 行号 | 原因 |
|------|------|------|
| `Carousel.vue` | 33 | 字符串模板 ref 未被 vue-tsc 识别 |
| `CarouselEnhanced.vue` | 62 | 同上 |
| `DataTableDemo.vue` | 36 | 泛型组件 InstanceType 推断限制 |

### 4. 类型断言分析

| 类型 | 数量 | 评估 |
|------|------|------|
| `as unknown as`（测试中） | 25 | 合理 — vue-test-utils 类型缺陷 |
| `as Record<string, unknown>`（CLI） | 7 | 轻微技术债务 — 可用 Zod 替代 |
| `as Record<string, unknown>`（UI） | 3 | 技术债务 — 可用类型守卫替代 |
| `as WindowWithWebkitAudio` | 1 | 合理 — webkitAudioContext 兼容 |
| `as never` | 1 | 技术债务 |

---

## 四、废弃代码和 Dead Code 审查

### 1. 可安全删除的文件

| 文件 | 问题 |
|------|------|
| `packages/ui/src/lib/test-utils.ts` | 完全未使用的工具函数 |

### 2. 公共 API 导出文件（保留）

| 文件                      | 说明                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| `packages/ui/src/hooks/index.ts` | 公共 API 导出，package.json 中有 `./hooks` 导出配置，供外部消费者使用 |

### 3. 重复导出文件

| 文件 | 说明 |
|------|------|
| `packages/ui/src/calendar.ts` | 与 `index.ts` 重复导出 Calendar 组件 |
| `packages/ui/src/submit-button.ts` | 与 `index.ts` 重复导出 SubmitButton 组件 |

### 4. 重复常量定义

| 常量                                        | 重复位置                                                         |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `DEFAULT_AUTOPLAY_DELAY = 3000`             | `Carousel.vue:11` + `useCarousel.ts:5`                           |
| `DEFAULT_PAGE_SIZE = 10`                    | `useDataTablePagination.ts:3` + `DataTableSection.vue:19`        |
| `DEFAULT_COPIED_DURATION = 2000`            | `useClipboard.ts:3` + `CopyToClipboard.vue:13`（名称略有差异）   |
| `DEFAULT_TOAST_DURATION = 5000`             | `useToast.ts:42` + `Toast.vue:13`（名称略有差异）                |

### 5. 其他问题

- `cli/src/commands/diff.ts:273` — `console.log` 未使用 `logger`
- `useToast.ts:179-189` / `useTheme.ts:177-188` — fallback 单例模式可考虑 deprecated
- 无 `@deprecated` 标记、无注释掉的代码、无 TODO/FIXME/HACK 注释、无 `debugger` 语句

---

## 五、依赖和构建兼容性审查

### 1. 高优先级问题

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 1 | **Tailwind v3 config 是 dead code** | `packages/ui/tailwind.config.js` | 删除，项目已使用 v4 `@plugin` 语法 |
| 2 | **`tailwindcss-animate` v1 可能与 Tailwind v4 不兼容** | `packages/ui/tailwind.config.js:40` | 验证 `@plugin "tailwindcss-animate"` 是否正常工作 |
| 3 | **无显式 `browserslist` 或 `build.target`** | 根 `package.json`, `packages/ui/package.json` | 添加明确的浏览器兼容目标 |

### 2. 中优先级问题

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 4 | `rimraf` 在 Node 22+ 上不必要 | `packages/ui/package.json` | 替换为原生命令 |
| 5 | 同时依赖 `happy-dom` 和 `jsdom` | `packages/ui/package.json` | 选择一个，移除另一个 |
| 6 | `vue-demi` 在传递依赖中 | `pnpm-workspace.yaml` | `v-calendar` 引入，可评估替代方案 |

### 3. 低优先级问题

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 7 | `shamefully-hoist=true` 破坏 pnpm 严格隔离 | `.npmrc` | 评估是否仍需要 |
| 8 | `strict-peer-dependencies=false` 静默忽略 peer 不匹配 | `.npmrc` | 评估风险 |
| 9 | 缺少 `.nvmrc` 文件 | 项目根目录 | 添加以统一 Node 版本 |
| 10 | `ignoreDeprecations: "6.0"` 表明有废弃选项 | `packages/cli/tsconfig.json:10` | 识别并替换 |
| 11 | CJS 构建格式可能不必要 | `packages/ui/vite.config.ts:47` | Vue 3 库通常只需 ESM |
| 12 | `.jsx`/`.tsx` 在 resolve.extensions 中无用 | `packages/ui/vite.config.ts:62` | 可移除 |

---

## 六、CSS 和样式兼容性审查

### 1. Vendor Prefixes（共 9 处）

全部合理且必要，详见第一章浏览器兼容性审查。

### 2. 无问题项

- 无 CSS hack（IE hack）
- 无过时 CSS 属性（`filter: alpha()`、`zoom: 1` 等）
- 无旧式媒体查询语法
- 无 `@supports` 特性查询（中性，非问题）

### 3. 可清理项

| 问题 | 位置 | 建议 |
|------|------|------|
| `word-wrap: normal` 可替换为 `overflow-wrap` | `brutx-prism.css:17` | 现代化 |
| font stack 中 `-apple-system`/`BlinkMacSystemFont` 冗余 | `styles.css:66-67` | `system-ui` 已广泛支持 |

---

## 建议行动

### 立即处理

1. 删除 Tailwind v3 配置文件（`packages/ui/tailwind.config.js`）
2. 删除未使用的 `test-utils.ts`

### 短期处理

3. 添加 `browserslist` 到 `package.json`
4. 清理重复常量定义（提取到共享位置）
5. 移除 `rimraf` 依赖
6. 选择 `happy-dom` 或 `jsdom`，移除另一个

### 长期改进

7. 验证 `tailwindcss-animate` 与 Tailwind v4 的兼容性
8. 逐步修复测试文件中的 `any` 类型
9. 评估 `.npmrc` 配置的必要性
10. 考虑 `useToast`/`useTheme` fallback 单例模式的 deprecation
