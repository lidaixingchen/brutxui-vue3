# BrutxUI-Vue3 技术债审查报告

> **审查日期**：2026-06-30
> **项目版本**：v0.8.1
> **审查范围**：packages/ui 核心组件库

---

## 一、摘要

本次技术债审查共发现 **95 项**问题，按类别分布如下：

| 类别 | 数量 | 严重程度分布 |
|------|------|-------------|
| 类型安全问题 | 44 | 高: 16 (生产代码), 中: 28 (测试代码) |
| 兼容性妥协 | 12 | 高: 0, 中: 4 (可清理), 低: 8 (必要保留) |
| 硬编码和魔法数字 | 34 | 中: 30, 低: 4 |
| 临时标记和待办 | 1 | 低: 1 |
| 依赖问题 | 10 | 高: 2, 中: 5, 低: 3 |

**总体评估**：项目技术债主要集中在**类型安全**和**硬编码**两个领域。兼容性处理整体合理，仅少数过时的 polyfill 需要清理。依赖管理存在分类错误和冗余声明问题。

---

## 二、高优先级问题

### 2.1 依赖分类错误（影响用户安装体验）

**问题描述**：`embla-carousel-vue` 被错误地放在 `dependencies` 中，但 Vite 构建配置的 `rollupOptions.external` 又将其外部化，导致用户未安装时运行时报错。

**影响**：
- 用户使用 Carousel 组件时可能遇到 "Module not found" 错误
- 构建产物不包含该依赖，但 package.json 声明为必需依赖

**建议方案**（推荐方案 A）：
- 方案 A（推荐）：移至 `peerDependencies`，在 `peerDependenciesMeta` 中标记 `optional: true` — 符合组件库惯例，Carousel 本身是可选组件
- 方案 B：从 `external` 配置中移除，让其打包到产物中（降低用户安装门槛，但增加包体积）

### 2.2 未使用的依赖（增加维护负担）

| 依赖 | 问题 | 建议 |
|------|------|------|
| `postcss` | devDependency，项目已使用 `@tailwindcss/vite`，postcss.config.cjs 为空 | 移除 |
| `tailwindcss-animate` | 完全未使用，源码无任何导入 | 移除 |

### 2.3 生产代码中的不安全类型断言（16 处）

**核心问题**：事件处理器中直接断言 `event.target` 为特定元素类型，缺少运行时类型守卫。

**高风险位置**（组件对外暴露的事件处理）：

| 文件 | 行号 | 断言 | 风险等级 |
|------|------|------|----------|
| `ColorPickerPanel.vue` | 134, 148 | `event.currentTarget as HTMLElement` | 中 |
| `ColorPickerInput.vue` | 57 | `event.target as HTMLInputElement` | 中 |
| `CommandInput.vue` | 40 | `event.target as HTMLInputElement` | 中 |
| `DialogEnhanced.vue` | 144 | `e.target as HTMLElement` | 中 |
| `Input.vue` | 97, 98 | 模板内联断言 | 低（Vue 模板事件绑定保证类型） |
| `Textarea.vue` | 72 | 模板内联断言 | 低 |
| `GallerySection.vue` | 76 | 模板内联断言 | 低 |

**建议**：对模板内联事件处理器，Vue 的事件绑定机制保证了类型安全，风险较低。对 `<script>` 块中的断言，建议添加 `instanceof` 守卫：

```typescript
// Before
const el = event.currentTarget as HTMLElement

// After
const el = event.currentTarget
if (!(el instanceof HTMLElement)) return
```

---

## 三、中优先级问题

### 3.1 测试代码中的双重类型断言（28 处）

**问题描述**：测试文件大量使用 `as unknown as T` 双重断言绕过类型检查。

**分布**：

| 测试文件 | 出现次数 | 主要断言对象 |
|----------|----------|-------------|
| `useColorPicker.test.ts` | 5 | `MouseEvent`, `KeyboardEvent` |
| `useDatePicker.test.ts` | 6 | `MouseEvent`, `KeyboardEvent` |
| `calendar.test.ts` | 4 | `wrapper.vm` |
| `data-table.test.ts` | 2 | `mount` 参数, `wrapper.vm` |
| `virtual-scroll.test.ts` | 5 | `wrapper.vm` |
| `scratch-card.test.ts` | 4 | `wrapper.vm`, `getContext` |
| 其他测试文件 | 2 | `wrapper.vm` |

**改进建议**：

1. **事件对象**：使用构造函数而非字面量断言
```typescript
// Before
const event = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent

// After
const event = new KeyboardEvent('keydown', { key: 'Enter' })
vi.spyOn(event, 'preventDefault')
```

2. **wrapper.vm**：使用 Vue Test Utilities 提供的类型推导，或定义测试专用的类型守卫
```typescript
// Before
const vm = wrapper.vm as unknown as CounterExposed

// After
// 方案 1: 使用类型参数
const wrapper = mount<CounterExposed>(Counter)
const vm = wrapper.vm  // 自动推导为 CounterExposed

// 方案 2: 定义类型守卫
function assertExposed(vm: unknown): asserts vm is CounterExposed {
  expect(vm).toHaveProperty('reset')
  expect(vm).toHaveProperty('increment')
}
```

### 3.2 硬编码和魔法数字（34 处）

**高频重复值**：

| 值 | 出现位置 | 建议常量名 |
|----|----------|-----------|
| `#FF6B6B` | SketchyChart, ScratchCard | `FALLBACK_PRIMARY_COLOR` |
| `#4ECDC4` | SketchyChart, ScratchCard | `FALLBACK_SECONDARY_COLOR` |
| `#000000` | SketchyChart, ScratchCard | `FALLBACK_FG_COLOR` |
| `3000` (ms) | Carousel, GlitchText, useCarouselEnhanced | `DEFAULT_INTERVAL_MS` |
| `10, 20, 50, 100` | DataTable, ActivityLogPage | `DEFAULT_PAGE_SIZE_OPTIONS` |
| `48` (px) | DataTable | `DEFAULT_VIRTUAL_ROW_HEIGHT` |
| `1000, 15, 10, 1.1, 300` | Card3D, CarouselEnhanced | 各自组件级常量 |

**改进基础**：`ScratchCard.vue` 已定义 `FALLBACK_PRIMARY_COLOR` 等常量，但未提取为共享模块。建议将其迁移至共享常量文件，供其他组件复用。

**优先处理**：主题色回退值（跨组件重复）和分页配置（业务逻辑相关）

### 3.3 peerDependency 版本范围过宽

| 依赖 | 当前声明 | 建议 | 原因 |
|------|----------|------|------|
| `@lucide/vue` | `^1.0.0` | `^1.17.0` | 使用了较新 API |
| `prismjs` | `^1.29.0` | 添加 `optional: true` | 仅 CodeBlock 使用 |
| `vee-validate` | `^4.0.0` | 添加 `optional: true` | 仅 Form 组件使用 |

> **注意**：`devDependencies` 中的 `@types/prismjs` 应同步调整为可选安装，或在 `prismjs` 未安装时跳过类型检查。

---

## 四、低优先级问题

### 4.1 `@ts-expect-error` 抑制

**位置**：`Carousel.vue:31`

**现状**：用于抑制 vue-tsc 对模板字符串 ref 的 TS6133 错误。有明确注释说明原因。

**处理建议**：跟踪 vue-tsc 上游 issue，待修复后移除。当前可接受。

### 4.2 临时标记

**位置**：`CodeBlock.vue:140`

**内容**：`eslint-disable-next-line vue/no-v-html`，附有安全说明（prismjs 已转义输入）。

**评估**：注释完整，安全假设合理。保留监控即可。

### 4.3 根目录重复依赖

**问题**：根目录 `devDependencies` 与 `packages/ui` 完全重复（`@vitejs/plugin-vue`, `typescript`, `vite`）。

**影响**：在 pnpm workspace 中不影响功能，但增加维护混乱。

**建议**：从根目录移除这三个重复项，保留仅用于 monorepo 管理的工具（如 husky、changeset 等）。

### 4.4 `postcss.config.cjs` 格式问题

**问题**：使用 CommonJS 格式，但 `package.json` 声明 `type: 'module'`。

**建议**：既然 postcss 依赖应被移除，此文件也可一并删除。

---

## 五、兼容性专项

### 5.1 浏览器目标配置冲突

**现状**：
- `.browserslistrc`：Chrome >= 105, Firefox >= 121, Safari >= 15.4
- `package.json`：Chrome >= 87, Firefox >= 78, Safari >= 14

**评估**：`.browserslistrc` 基于实际使用的 Web 特性制定，更为准确。

**建议**：删除 `package.json` 中的 `browserslist` 字段，统一使用 `.browserslistrc`。

### 5.2 可清理的兼容性代码

| 文件 | 代码 | 原因 | 建议 |
|------|------|------|------|
| `locales/index.ts:11` | `structuredClone` 降级 | 目标浏览器已全面支持 | 移除降级，直接使用 `structuredClone` |
| `useAudioEngine.ts:35` | `webkitAudioContext` 前缀 | Safari 15.4 已无前缀 | 直接使用 `AudioContext` |
| `useCanvasInteraction.ts:211` | `typeof ResizeObserver` 守卫 | 目标浏览器已全面支持 | 移除守卫 |
| `Counter.vue:133` | `typeof ResizeObserver` 守卫 | 同上 | 移除守卫 |

### 5.3 需要重新评估的"兼容性代码"

| 类型 | 代码 | 当前位置 | 问题 | 建议处理方式 |
|------|------|----------|------|--------------|
| CSS 前缀 | `-webkit-text-size-adjust` | `styles.css:57` | 组件库不应硬编码全局样式前缀 | 移除，由用户项目的 Autoprefixer 处理 |
| CSS 前缀 | `-webkit-font-smoothing`, `-moz-osx-font-smoothing` | `styles.css:68-69` | 同上，且非标准属性 | 移除，用户可自行添加到项目样式 |
| SSR 守卫 | `typeof document/window/localStorage` | 10 个文件 | 分散检查，缺乏统一抽象 | 提取 `isClient()` 工具函数，或使用 `@vueuse/core` |
| 功能检测 | `navigator.clipboard` 守卫 | 1 个文件 | 非安全上下文场景极少 | 保留，但添加注释说明适用场景 |
| 存储守卫 | `useTheme.ts` 的 try-catch | 1 个文件 | Safari 隐私模式兼容 | **保留** — 这是真实的运行时问题，无法通过构建解决 |

### 5.4 滚动条样式问题

**位置**：`apps/docs/.vitepress/theme/style.css:884`

**现状**：仅使用 `::-webkit-scrollbar` 伪元素，Firefox 用户将看到默认细滚动条。

**建议**：添加 Firefox 互补样式：
```css
* {
  scrollbar-width: thin;
  scrollbar-color: var(--brutal-border) transparent;
}
```

---

## 六、改进建议

按优先级排序的具体行动项：

> **执行状态**（2026-06-30）：P0 全部完成 ✅ | P1 全部完成 ✅ | P2 #12-13 完成 ✅ | P2 #14 待调研

### P0 - 立即处理（影响稳定性） ✅ 已完成

| # | 行动项 | 状态 | 影响范围 | 涉及文件 |
|---|--------|------|----------|----------|
| 1 | 修复 `embla-carousel-vue` 依赖分类 | ✅ | Carousel 组件 | `packages/ui/package.json` |
| 2 | 移除未使用的 `postcss` 和 `tailwindcss-animate` | ✅ | 全局 | `packages/ui/package.json`, `postcss.config.cjs` |
| 3 | 统一浏览器目标配置 | ✅ | 全局 | `package.json` |

### P1 - 迭代计划（提升可维护性） ✅ 已完成

| # | 行动项 | 状态 | 影响范围 | 涉及文件 |
|---|--------|------|----------|----------|
| 4 | 清理过时的兼容性代码 | ✅ | locales、Audio、Canvas、Counter | 4 个文件 |
| 5 | 提取主题色回退值到共享常量 | ✅ | ScratchCard | 新建 `lib/theme-fallbacks.ts` |
| 6 | 更新 peerDependency optional 标记 | ✅ | CodeBlock、Form | `packages/ui/package.json` |
| 7 | 添加生产代码的类型守卫 | ✅ | 5 个组件 | 5 个组件文件 |
| 8 | 提取高频魔法数字为常量 | ✅ | 4 个组件 | 新建 `lib/defaults.ts`，4 个文件 |
| 9 | 重构测试代码的双重类型断言 | ✅ | 7 个测试文件 | 7 个测试文件 |
| 10 | 移除 styles.css 中的 CSS 前缀 | ✅ | 全局样式 | `packages/ui/src/styles.css` |
| 11 | 统一 SSR 守卫为工具函数 | ✅ | 10 个文件 | 新建 `lib/env.ts`，10 个文件 |

### P2 - 长期跟踪（代码质量）

| # | 行动项 | 状态 | 影响范围 | 涉及文件 |
|---|--------|------|----------|----------|
| 12 | 添加 Firefox 滚动条样式 | ✅ | 文档站 | `apps/docs/.vitepress/theme/style.css` |
| 13 | 清理根目录重复依赖 | ✅ | monorepo 根 | 根目录 `package.json` |
| 14 | 评估 prismjs 迁移到 shiki | ⏳ 待调研 | CodeBlock | 仅调研，不实施 |

### P3 - 监控项

| # | 行动项 | 状态 | 说明 |
|---|--------|------|------|
| 15 | 移除 `@ts-expect-error`（Carousel.vue） | ⏳ 待上游修复 | vue-tsc TS6133 仍存在（2026-06-30 验证），需等待 vue-tsc 修复 |
| 16 | 移除 `-webkit-mask-image` 前缀 | ✅ 已完成 | Safari 15.4+ 已支持无前缀 `mask-image` |
| 17 | v-html 安全性持续监控 | ℹ️ 监控中 | CodeBlock.vue 使用场景未变化，prismjs 已转义输入 |

---

## 七、技术债趋势建议

1. **建立 ESLint 规则**：添加 `@typescript-eslint/consistent-type-assertions` 规则，禁止 `as unknown as T` 双重断言，强制使用类型守卫或类型参数。

2. **创建常量模块**：建立 `packages/ui/src/constants/` 目录，按领域组织常量：
   - `theme.ts`：主题色回退值
   - `defaults.ts`：组件默认配置值
   - `animation.ts`：动画相关常量

3. **依赖审计流程**：在 CI 中添加依赖使用率检查脚本，定期扫描未使用的 devDependencies。

4. **兼容性代码标记**：为必要的兼容性代码添加 `@compat` 标签注释，便于未来批量清理。

---

**报告生成时间**：2026-06-30
**下次建议审查时间**：2026-09-30（季度审查）
