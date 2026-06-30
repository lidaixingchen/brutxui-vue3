# 技术栈选型改进方案

> 审查日期：2026-06-30
> 修正日期：2026-06-30
> 审查范围：全量依赖、构建配置、架构分层、包体积
> 审查结论：技术栈整体合理，处于 Vue 3 UI 库主流最佳实践水平。以下为可优化项。
>
> **原则：专注于技术优化本身，无需考虑向后兼容性，无需为历史包袱预留空间。**

---

## 一、P1 — 建议尽快处理

### 1. styles.css 与 brutalism-plugin.js 重复定义

`styles.css` 的 `@layer components` 中手动定义了 `nb-border`、`nb-shadow`、`nb-press`、`nb-font` 四个基础类，而 `brutalism-plugin.js` 通过 Tailwind plugin 的 `addUtilities` 又定义了一遍（且包含更多变体）。

| 定义 | styles.css `@layer components` | brutalism-plugin.js `addUtilities` |
| --- | --- | --- |
| `.nb-border` | ✅ | ✅ |
| `.nb-border-2` | — | ✅ |
| `.nb-border-4` | — | ✅ |
| `.nb-shadow` | ✅ | ✅ |
| `.nb-shadow-sm` | — | ✅ |
| `.nb-shadow-lg` | — | ✅ |
| `.nb-shadow-xl` | — | ✅ |
| `.nb-press` | ✅ | ✅ |
| `.nb-press-sm` | — | ✅ |
| `.nb-press-lg` | — | ✅ |
| `.nb-font` | ✅ | ✅ |
| `.nb-font-bold` | — | ✅ |
| `.nb-font-medium` | — | ✅ |

**验证结果**：

- `grep` 搜索 `*.vue` 文件中 `.nb-border`、`.nb-shadow`、`.nb-press`、`.nb-font` 的使用：**0 个文件命中**
- 这些类仅在 plugin 和 styles.css 中定义，组件内部使用的是 CVA 变体（如 `border-3 border-brutal shadow-brutal`）

**问题**：两处同时生效，增加 CSS 体积，可能产生层优先级歧义（`@layer components` vs Tailwind utilities 层）。

**修复方案**：

- 删除 `styles.css` 中 `@layer components` 块（第 358-379 行），plugin 中的定义更完整且是实际使用的来源
- `styles.css` 中 `@layer utilities` 里的 `border-3`、`border-brutal`、`shadow-brutal` 等与 `@theme` 中的 `--border-width-3`、`--shadow-brutal` 等**不是重复**——`@theme` 定义 CSS 变量，`@layer utilities` 定义使用这些变量的工具类，两者互补

---

### 2. brutalism-plugin.js 使用 CommonJS 格式

项目 `"type": "module"`，但 plugin 文件使用 `require()` / `module.exports`。

```js
// 当前（packages/ui/src/lib/brutalism-plugin.js）
const plugin = require('tailwindcss/plugin');
module.exports = brutalismPlugin;
```

**问题**：与项目 ESM 基调不一致。Tailwind v4 的 `@plugin` 指令支持加载 CJS，但混合模块格式增加维护认知负担。

**修复方案**：Tailwind v4 的 `@plugin` 支持 ESM，可改为：

```js
// brutalism-plugin.js（ESM）
import plugin from 'tailwindcss/plugin'

const brutalismPlugin = plugin(({ addUtilities, addComponents }) => {
    // ...
})

export default brutalismPlugin
```

**注意**：`styles.css` 中使用 `@plugin "./lib/brutalism-plugin.js"` 引用，转 ESM 后无需修改此引用（Tailwind v4 同时支持 CJS/ESM plugin）。

同步将 `tailwind.config.cjs` 改为 `tailwind.config.js`（ESM）或直接删除——Tailwind v4 的 CSS-first 模式下，`tailwind.config.cjs` 已被 `styles.css` 中的 `@theme`/`@plugin`/`@source` 替代。需确认 docs 端是否仍需要该文件（见 P2-6）。

---

### 3. `tailwindcss` peerDependency 版本范围过宽

```json
"peerDependencies": {
    "tailwindcss": ">=4.0.0"
}
```

**问题**：Tailwind 的大版本间配置约定完全不同（v3 JS config vs v4 CSS-first）。`>=4.0.0` 暗示兼容未来 v5、v6，但几乎必然不兼容。

**修复方案**：

```json
"peerDependencies": {
    "tailwindcss": ">=4.0.0 <5.0.0"
}
```

发布 major 版本时再根据 Tailwind v5 实际情况调整。

---

## 二、P2 — 可在下个迭代处理

### 4. v-calendar 静态 import 导致无法 tree-shake

**当前状态**（已确认）：

- `peerDependencies` 中已声明 `"v-calendar": ">=3.0.0"`
- `peerDependenciesMeta` 中已配置 `"v-calendar": { "optional": true }`
- ✅ 包管理器层面的可选化**已完成**

**实际问题**：Calendar/DatePicker 组件使用**静态 import**，导致即使消费者不使用日历组件，v-calendar 仍会被打包：

```typescript
// Calendar.vue 第 3 行 — 静态 import
import { DatePicker } from 'v-calendar'

// DatePickerPanel.vue 第 3 行 — 静态 import
import { DatePicker } from 'v-calendar'
```

共 5 个文件静态引用 v-calendar：

- `Calendar.vue`
- `DatePickerPanel.vue`
- `DatePickerRangePanel.vue`
- `DateTimePickerPanel.vue`
- `WeekPickerPanel.vue`

**修复方案**：改为动态 import + 运行时检查：

```typescript
// Calendar.vue
import { defineAsyncComponent } from 'vue'

const VCalendar = defineAsyncComponent(async () => {
    try {
        const mod = await import('v-calendar')
        return mod.DatePicker
    } catch {
        console.warn('[BrutxUI] Calendar component requires v-calendar. Install it: pnpm add v-calendar')
        // 返回空壳组件避免运行时报错
        return { template: '<div/>' }
    }
})
```

**SSR 兼容性注意**：`defineAsyncComponent` 在 SSR 环境下需要配合 `<Suspense>` 使用，需在文档中说明。

---

### 5. `styles.css` 中 `@import 'v-calendar/dist/style.css'` 无条件引入

```css
// styles.css 第 1 行
@import 'v-calendar/dist/style.css';
```

**问题**：即使消费者不使用 Calendar 组件，v-calendar 的基础样式也会被打包进 `styles.css`。

**修复方案**：

- 将 v-calendar 样式从 `styles.css` 中移除
- 在 Calendar 组件内部引入：`import 'v-calendar/dist/style.css'`
- 或单独导出 `calendar-styles.css`，在 `exports` map 中添加入口

**注意**：此改动与 P2-4 应同步处理。

---

### 6. docs 端 `tailwind.config.cjs` 与 UI 端配置重复

`apps/docs/tailwind.config.cjs` 中的 `theme.extend`（colors、boxShadow、borderWidth）与 `packages/ui` 的配置几乎完全一致。

**验证数据**：

| 配置项 | UI 端（brutalism-plugin.js） | Docs 端（tailwind.config.cjs） |
|--------|------------------------------|-------------------------------|
| colors.brutal | ✅ 16 个变量 | ✅ 12 个变量（缺少 primary-foreground 等） |
| boxShadow.brutal | ✅ 4 个变体 | ✅ 4 个变体（完全一致） |
| borderWidth.3 | ✅ | ✅ |
| borderRadius.brutal | ✅ | ❌ 缺失 |
| borderColor.brutal | ✅ | ❌ 缺失 |

**问题**：

1. 修改主题变量时需同步两处，易遗漏
2. Docs 端配置不完整（缺少 borderRadius、borderColor、部分 color 变量）

**修复方案**：docs 端直接导入 UI 包的 CSS（`import 'brutx-ui-vue/styles.css'`），利用 Tailwind v4 的 CSS-first 配置继承，删除 docs 端的 `tailwind.config.cjs` 和 `postcss.config.cjs`。

**前置验证**：已验证 VitePress 支持 `@tailwindcss/vite` 插件。PoC 结果：

1. ✅ 在 docs 的 `.vitepress/config.ts` 中添加 `@tailwindcss/vite` 插件
2. ✅ 删除 `tailwind.config.cjs` 和 `postcss.config.cjs`
3. ✅ docs 构建成功（40.47s）

**已执行改动**：

- `apps/docs/.vitepress/config.ts`：添加 `import tailwindcss from '@tailwindcss/vite'`，在 `vite.plugins` 中注册
- `apps/docs/.vitepress/theme/style.css`：移除 `@config '../../tailwind.config.cjs'` 和 `@import 'v-calendar/dist/style.css'`
- `apps/docs/package.json`：`@tailwindcss/postcss` 替换为 `@tailwindcss/vite`，移除 `postcss` 和 `tailwindcss-animate`
- 删除 `apps/docs/tailwind.config.cjs` 和 `apps/docs/postcss.config.cjs`

---

### 7. reka-ui 版本约束未显式声明

reka-ui 是 `dependencies`（非 peerDep），消费者无法控制其版本。如果消费者自己也直接使用 reka-ui，可能产生两份不同版本。

**当前影响**：有限。reka-ui 遵循 semver，且 npm/pnpm 的依赖解析通常会去重。

**建议**：在文档中说明 reka-ui 的版本范围，或在 `peerDependencies` 中添加可选声明：

```json
"peerDependencies": {
    "reka-ui": ">=2.9.0"
},
"peerDependenciesMeta": {
    "reka-ui": { "optional": true }
}
```

---

## 三、P3 — 长期改进方向

### 8. 402 行 index.ts 导出膨胀

`src/index.ts` 导出了全部 215 个组件 + 全部 locale 类型 + 全部 composable。即使消费者只用 Button，IDE 自动补全面也会包含所有导出。

**现状评估**：

- 类型导出（`export type`）对运行时无影响
- `sideEffects` 已正确配置为 `["**/*.css", "*.css"]`，tree-shaking 可正常工作
- 实际影响主要在 DX（IDE 性能）

**长期方案**：

- 为高频组件提供子路径导出：`import { Button } from 'brutx-ui-vue/button'`
- 目前已有 `calendar`、`submit-button`、`hooks`、`brutalism-plugin`、`locales` 子路径，可扩展模式
- 可考虑拆分 `index.ts` 为多个模块入口，减少 IDE 加载负担

---

### 9. TypeScript 版本约束

项目 devDependencies 使用 `typescript: ^6.0.3`，但未声明消费者端的 TS 版本要求。

**建议**：在文档中说明最低支持的 TypeScript 版本（建议 >=5.5），或在 `peerDependencies` 中添加可选声明。

---

### 10. `@tanstack/vue-virtual` 作为直接依赖

VirtualScroll 组件使用 `@tanstack/vue-virtual` 作为实现细节。目前作为 `dependencies` 是合理的，但如果消费者也使用该库，可能产生版本冲突。

**建议**：与 `v-calendar` 同理，可考虑移至 optional peerDependency。优先级低于 v-calendar 的优化。

---

## 四、已确认合理、无需改动的选型

| 选型 | 理由 |
|------|------|
| reka-ui 作为无头原语 | Vue 生态最成熟的无头原语库，API 贴合组合式风格 |
| CVA 作为变体系统 | shadcn/ui 验证过的模式，类型推导优秀，输出纯字符串不绑定 CSS 引擎 |
| clsx + tailwind-merge via `cn()` | Vue + Tailwind 生态事实标准，212 个文件统一使用 |
| pnpm workspaces monorepo | 硬链接节省磁盘，workspace 协议简化本地依赖 |
| Vitest | Vite 原生集成，零重复配置 |
| VitePress 文档 | Vue 生态标准文档方案 |
| Tailwind CSS v4 + @tailwindcss/vite | Vite 原生插件，CSS-first 配置，构建性能优秀 |
| `@apply` 使用量为 0 | 正确做法——组件样式通过 CVA 类名而非 `@apply`，保持了 Tailwind 的原子性 |
| `v-bind()` 使用量为 0 | 避免了 Tailwind 与 Vue CSS v-bind 的潜在兼容性摩擦 |
| `sideEffects` 配置 | 已正确声明 `["**/*.css", "*.css"]`，tree-shaking 可正常工作 |
| v-calendar 可选化 | peerDependencies + peerDependenciesMeta 已配置完成 |

---

## 五、执行批次规划

改进项之间存在隐性依赖，按批次执行更高效：

### 执行状态

| 批次 | 状态 | 完成日期 |
|------|------|----------|
| 1 | ✅ 完成 | 2026-06-30 |
| 2 | ✅ 完成 | 2026-06-30 |
| 3 | ✅ 完成 | 2026-06-30 |
| 4 | ✅ 完成 | 2026-06-30 |
| 5 | ✅ 完成 | 2026-06-30 |

### 批次 1：ESM 统一 + 配置清理

| 编号 | 改进项 | 影响 | 工作量 | 风险 |
|------|--------|------|--------|------|
| 2 | brutalism-plugin.js 转 ESM | 一致性 ↑ | 低 | 低 |
| 1 | 清理 styles.css `@layer components` 重复定义 | CSS 体积 ↓ | 低 | 低 |
| 3 | 收紧 tailwindcss peerDep 范围 | 防止未来不兼容 | 极低 | 无 |

**理由**：改动范围集中在 plugin 和 package.json，可一次 PR 完成。

### 批次 2：v-calendar 条件化

| 编号 | 改进项 | 影响 | 工作量 | 风险 |
|------|--------|------|--------|------|
| 4 | v-calendar 静态 import 改动态 import | tree-shaking 生效 | 中 | 中 |
| 5 | v-calendar 样式条件引入 | CSS 体积 ↓ | 低 | 低 |

**理由**：4 和 5 紧密关联，应同步处理。需注意 SSR 兼容性。

### 批次 3：Docs 端配置优化

| 编号 | 改进项 | 影响 | 工作量 | 风险 |
|------|--------|------|--------|------|
| 6 | docs 端去重 tailwind 配置 | 可维护性 ↑ | 中 | 中 |

**前置条件**：批次 1 完成（plugin 已转 ESM）。需先做 PoC 验证 VitePress 兼容性。

### 批次 4：版本约束透明化

| 编号 | 改进项 | 影响 | 工作量 | 风险 |
|------|--------|------|--------|------|
| 7 | reka-ui 版本声明 | 透明度 ↑ | 极低 | 无 |
| 9 | TS 版本文档 | 透明度 ↑ | 极低 | 无 |

### 批次 5：长期优化

| 编号 | 改进项 | 影响 | 工作量 | 风险 |
|------|--------|------|--------|------|
| 8 | 子路径导出扩展 | DX ↑ | 高 | 低 |
| 10 | @tanstack/vue-virtual 可选化 | 包体积 ↓ | 低 | 低 |

---

## 六、原方案勘误

| 原方案描述 | 实际情况 |
|-----------|---------|
| "v-calendar 未做可选化处理" | ❌ `peerDependenciesMeta` 已配置 `optional: true` |
| "v-calendar 仍在主 dependencies 中" | ❌ 已在 `peerDependencies` 中，非 `dependencies` |
| 缺少 `sideEffects` 检查 | ❌ 已配置 `["**/*.css", "*.css"]` |
| styles.css `@layer utilities` 与 `@theme` 重复 | ❌ 两者互补，非重复 |
| v-calendar 约 50KB gzipped | ⚠️ 未验证实际体积，建议 bundle 分析确认 |
