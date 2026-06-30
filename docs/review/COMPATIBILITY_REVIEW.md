# 组件库兼容性包袱审查报告

> 审查日期：2026-06-30
> 审查范围：`packages/ui/src/components/` 全部 60+ 组件目录 + `packages/ui/src/composables/` 全部 composable
> 审查维度：Vue 版本、TypeScript 严格模式、reka-ui、SSR 安全性、可选依赖、Tailwind CSS、浏览器 API、内存泄漏、无障碍
> 修正日期：2026-06-30（补充 Toast、TreeView SSR 问题，修正 useId() 结论）
> 修复日期：2026-06-30（完成第一阶段全部 + 第二阶段 4/5 项 + 第三阶段 5/6 项）

---

## 一、严重问题（P0 - 立即修复）

### 1. vee-validate 可选依赖导致 Form/FormField 崩溃

**影响组件**：`Form.vue`、`FormField.vue`、`form-context.ts`

`vee-validate` 在 `peerDependenciesMeta` 中标记为 `optional: true`，但 Form 系列组件在模块顶层同步导入了 vee-validate 的运行时 API。未安装 vee-validate 的消费者 import 时会直接崩溃。

| 文件 | 问题 |
|------|------|
| `Form.vue:3` | `import { useForm } from 'vee-validate'` 静态导入 |
| `FormField.vue:3` | `import { useField } from 'vee-validate'` 静态导入 |
| `form-context.ts:2` | `import type { FormContext as VeeFormContext } from 'vee-validate'`，TS 类型检查阶段报错 |

**修复方案**：

- 方案 A（推荐）：将 vee-validate 从 optional 改为 required peerDependency
- 方案 B：使用动态 `import()` 延迟加载，组件内做运行时检查

```typescript
// 方案 B 示例：动态导入 + 运行时检查
let useForm: typeof import('vee-validate')['useForm'] | undefined
try {
    const mod = await import('vee-validate')
    useForm = mod.useForm
} catch {
    // vee-validate 未安装，降级处理
}
```

---

### 2. prismjs 可选依赖导致 CodeBlock 崩溃

**影响组件**：`code-block/prism-languages.ts`

`prismjs` 标记为 optional peerDependency，但 `prism-languages.ts` 第 1 行使用了 `import Prism from 'prismjs'` 静态导入。未安装时构建直接报模块解析错误。

| 文件 | 问题 |
|------|------|
| `prism-languages.ts:1` | `import Prism from 'prismjs'` 顶层静态导入 |
| `prism-languages.ts:4-5` | `(globalThis as Record<string, unknown>).Prism = Prism` 类型断言绕过检查 |

**修复方案**：

```typescript
// 改为动态导入 + 降级
let Prism: typeof import('prismjs')['default'] | null = null
try {
    const mod = await import('prismjs')
    Prism = mod.default
} catch {
    Prism = null // 降级到 plaintext 模式
}
```

同时为 globalThis 扩展类型声明：

```typescript
declare global {
    var Prism: typeof import('prismjs')['default'] | undefined
}
```

---

### 3. VirtualScroll 的 useVirtualizer 参数非响应式

**影响组件**：`virtual-scroll/VirtualScroll.vue`

`@tanstack/vue-virtual` 的 `useVirtualizer` 接受 getter 函数实现响应式。当前 `count: props.items.length` 在组件初始化时求值一次后不再更新，items 增减时虚拟列表不渲染新项。

| 文件 | 行号 | 问题 |
|------|------|------|
| `VirtualScroll.vue:25` | `count: props.items.length` | 非响应式，仅求值一次 |
| `VirtualScroll.vue:28` | `overscan: props.overscan` | 非响应式，运行时更改不生效 |

**修复方案**：

```typescript
const virtualizer = useVirtualizer({
    count: () => props.items.length,      // 改为 getter
    getScrollElement: () => parentRef.value,
    estimateSize: () => props.itemHeight,
    overscan: () => props.overscan,       // 改为 getter
})
```

---

### 4. ChatBubble/ChatContainer 类型重复定义

**影响组件**：`chat-bubble/ChatBubble.vue`、`chat-bubble/ChatContainer.vue`

`ChatMessage` 接口在两个文件中重复定义且均未导出，消费者无法引用此类型，且两处维护不同步。

| 文件 | 行号 | 问题 |
|------|------|------|
| `ChatBubble.vue:12-20` | `interface ChatMessage` | 未导出，组件私有 |
| `ChatContainer.vue:10-18` | `interface ChatMessage` | 重复定义，独立维护 |

**修复方案**：

```typescript
// chat-bubble/types.ts（新建）
export interface ChatMessage {
    id: string
    content: string
    avatar?: string
    name?: string
    timestamp?: Date
    isOwn?: boolean
    status?: MessageStatus
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'
```

```typescript
// ChatBubble.vue / ChatContainer.vue
import type { ChatMessage } from './types'
```

同时更新 `chat-bubble/index.ts` 导出 `ChatContainer`：

```typescript
export { default as ChatBubble } from './ChatBubble.vue'
export { default as ChatContainer } from './ChatContainer.vue'
export type { ChatMessage, MessageStatus } from './types'
```

---

### 5. v-calendar 作为 dependency 打入产物

**影响组件**：`calendar/Calendar.vue`

`v-calendar: ^3.1.0` 是 `dependencies`（非 peerDependency），被打包到库产物中，增大包体积且存在版本冲突风险。同时 Calendar 组件大量使用 `!important` 覆盖 v-calendar 内部样式，深度耦合其 DOM 结构。

| 文件 | 问题 |
|------|------|
| `package.json:89` | `v-calendar` 在 dependencies 中 |
| `Calendar.vue:161-271` | 大量 `!important` 覆盖 v-calendar 内部类名 |

**修复方案**：

- 将 `v-calendar` 从 `dependencies` 移至 `peerDependencies`，在文档中注明推荐版本
- 或者考虑提供不依赖 v-calendar 的纯 CSS 日历组件

---

## 二、中等问题（P1 - 尽快修复）

### 6. SSR 安全性：直接访问浏览器全局 API

以下组件直接访问 `document`/`window` 无守卫，SSR 环境中会崩溃：

| 组件 | 文件:行号 | API |
|------|----------|-----|
| HardcoreInput | `HardcoreInput.vue:84` | `window.setTimeout` |
| Toast | `Toast.vue:52, 59` | `window.setTimeout` |
| TreeSelectNode | `TreeSelectNode.vue:68-72` | `document.activeElement`、`document.querySelectorAll` |
| TreeView | `TreeView.vue:102, 126, 137` | `document.activeElement` |
| DialogEnhanced | `DialogEnhanced.vue:155-156, 187-188` | `document.addEventListener` |

**修复方案**：

```typescript
// HardcoreInput.vue:84 / Toast.vue:52, 59
// 修改前
window.setTimeout(...)
// 修改后
setTimeout(...)  // 去掉 window. 前缀即可在 SSR 中安全运行

// TreeSelectNode.vue / TreeView.vue / DialogEnhanced.vue
if (typeof document === 'undefined') return
```

---

### 7. DropdownMenuSubContent 样式硬编码

**位置**：`DropdownMenuSubContent.vue:14-23`

样式直接硬编码在组件内，未复用 `dropdown-menu-variants.ts` 中的 `dropdownMenuContentVariants`。主题修改时 SubContent 不会自动同步。

**修复方案**：将样式提取到 `dropdown-menu-variants.ts`，新增 `dropdownMenuSubContentVariants` 或复用 `dropdownMenuContentVariants`。

---

### 8. DatePicker 系列 API 不一致

**影响组件**：`DateTimePicker.vue`、`MonthPicker.vue`、`WeekPicker.vue`、`YearPicker.vue`

这些变体使用 `ref(false)` 管理 open 状态，不支持 `v-model:open` 受控模式，与 `DatePicker.vue`（通过 `useDatePicker` composable 实现受控 open）API 不一致。

**修复方案**：统一使用 `useDatePicker` composable 或实现相同的 computed get/set 受控模式。

---

### 9. CarouselEnhanced 逻辑重复

**位置**：`CarouselEnhanced.vue:63-164`

完全绕过 `useCarousel` composable，自行管理 embla 实例、autoplay、scroll 状态，导致：
- 两套并行的 carousel 逻辑，维护成本高
- 缺少 `useReducedMotion` 支持（`useCarousel` 已实现）
- 未从 `carousel/index.ts` 子路径导出

**修复方案**：重构 `CarouselEnhanced` 使用 `useCarousel` composable，并在 `carousel/index.ts` 中添加导出。

---

### 10. 图片无错误处理

**影响组件**：`GallerySection.vue`、`ChatBubble.vue`

`<img>` 标签无 `@error` 处理，外部资源加载失败时显示破裂图标，无优雅降级。

**修复方案**：

```vue
<img
    :src="item.src"
    @error="($event.target as HTMLImageElement).style.display = 'none'"
/>
```

---

### 11. Separator 文字模式绕过 reka-ui

**位置**：`Separator.vue:53-61`

文字分隔线模式完全不使用 reka-ui 的 `SeparatorPrimitive`，手动渲染 `<div>` 并设置 `role`，丧失了 reka-ui 的 `data-orientation` 属性管理和未来的无障碍增强。

**修复方案**：在文字模式下仍使用 `SeparatorPrimitive` 包裹，或在文档中明确说明此设计决策。

---

### 12. noise-background 直接操作 SVG DOM

**位置**：`NoiseBackground.vue:73`

`turbulenceRef.value.setAttribute('baseFrequency', ...)` 绕过 Vue 响应式系统直接操作 DOM。

**修复方案**：考虑使用 Vue 的 `:attr` 绑定替代命令式 DOM 操作（如果 SVG 属性支持响应式绑定）。

---

### 13. data-table-section 类型断言与性能

| 文件:行号 | 问题 |
|----------|------|
| `DataTableSection.vue:90-91` | `handleRowClick(row: unknown)` 断言为 `T`，多余且不安全 |
| `DataTableSection.vue:47-55` | 全列搜索无 debounce，O(n*m) 复杂度 |
| `DataTableSection.vue:59,83,87` | 泛型组件中多处 `as keyof T & string` 断言 |

**修复方案**：

```typescript
// 修复 handleRowClick
function handleRowClick(row: T) {  // 改为 T 类型，去掉 unknown
    emit('row-click', row)
}

// 修复搜索性能
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 300)
})
```

---

## 三、轻微问题（P2 - 可选优化）

| # | 组件 | 问题 | 位置 |
|---|------|------|------|
| 14 | RadioGroup | `val as string` 类型断言，掩盖 reka-ui 事件类型不匹配 | `RadioGroup.vue:30` |
| 15 | NumberInput | 解构忽略变量模式（`_`, `__`），新增 prop 时易遗漏 | `NumberInput.vue:38-41` |
| 16 | FormWizard | `@/` 路径别名与库内其他组件的相对路径风格不一致 | `FormWizard.vue:35` |
| 17 | DatePickerRange | 多余的可选链 `?.`，DateRange 元组保证非空 | `DatePickerRange.vue:60-61` |
| 18 | ColorPickerPanel | `setPointerCapture` 缺少运行时能力检测 | `ColorPickerPanel.vue:135` |
| 19 | CookieConsent | `aria-live="polite"` 在 `v-if` 控制的元素上不生效 | `CookieConsent.vue:80` |
| 20 | FileCard | `downloadIconClasses` 在模块级计算而非 `computed` | `FileCard.vue:43` |
| 21 | ChatBubble | 行尾分号风格与库内其他组件不一致 | `ChatBubble.vue` 全文 |
| 22 | form-wizard | `stepErrors`/`completedSteps` 用 Map/Set 作 ref 值，响应式追踪不直观 | `FormWizard.vue:57-58` |
| 23 | useToast / useTheme | fallback 单例在 SSR 场景下可能跨请求共享状态 | `useToast.ts:164-191`、`useTheme.ts:163-188` |
| 24 | typewriter-text | 光标动画使用全局 `<style>` 而非 scoped | `TypewriterText.vue:161-174` |
| 25 | AccordionContent/Trigger | inject fallback 每次创建新 computed 实例 | `AccordionContent.vue:10`、`AccordionTrigger.vue:14` |
| 26 | Carousel + CarouselEnhanced | `@ts-expect-error` 抑制 vue-tsc 限制，需验证是否已修复 | `Carousel.vue:33`、`CarouselEnhanced.vue:61` |
| 27 | CarouselEnhanced | `progressInterval = 50` 魔法数字 | `CarouselEnhanced.vue:102` |
| 28 | Tabs / ToggleGroup | `$event as string` 事件类型断言 | `Tabs.vue:29`、`ToggleGroup.vue:55` |
| 29 | Stepper | 动态 slot 名称无法被 IDE 静态分析 | `Stepper.vue:232` |
| 30 | toast | `aria-live="off"` 不利于屏幕阅读器播报 | `ToastContainer.vue:97` |
| 31 | sketchy-chart | `useId()` 仅 Vue 3.5+，已通过 peerDep `>=3.5.0` 约束，无风险 | `SketchyChart.vue:33` |
| 32 | copy-to-clipboard | Clipboard API 无 `execCommand('copy')` 降级 | `useClipboard.ts:7` |
| 33 | counter | 模块级 `let` 变量在 SSR 下可能状态泄漏 | `Counter.vue:56-59` |
| 34 | data-table-section | 泛型组件中 `as keyof T & string` 断言较多 | `DataTableSection.vue:59,83,87` |
| 35 | BreadcrumbPage | `role="link"` + `aria-disabled` 模式，ARIA 最佳实践推荐 `<span>` | `BreadcrumbPage.vue:22-24` |

---

## 四、按审查维度总结

### Vue 版本兼容性

**评价：✅ 良好**

- 全部使用 `<script setup lang="ts">` + Composition API，无 Vue 2 遗留写法
- `useId()`（Vue 3.5+）使用正确，符合 peerDependency `>=3.5.0` 要求
- `defineProps<T>()` + `withDefaults`、`MaybeRefOrGetter` / `toValue()` 均为 Vue 3.3+ 标准 API
- 未发现 `Options API`、`Vue.extend`、`this.$` 等 Vue 2 遗留

### TypeScript 严格模式

**评价：✅ 良好**

- 无 `any` 类型使用
- 所有 props 均有明确接口定义
- emit 使用泛型签名 `defineEmits<{ 'update:modelValue': [value: string] }>()`
- 少量 `as` 断言均为 reka-ui 事件类型限制或 DOM 操作的必要断言

### reka-ui 兼容性

**评价：✅ 良好**

- 依赖 `reka-ui: ^2.9.9`，所有使用的 API 均为稳定版本
- 正确使用原语：`Dialog*`、`Popover*`、`Tooltip*`、`Select*`、`Checkbox*`、`Switch*`、`RadioGroup*`、`NumberField*`、`TagsInput*`、`Label`、`Toggle*`、`Accordion*`、`Tabs*`、`ScrollArea*`、`Progress*`、`Avatar*`、`Listbox*`
- `useForwardProps` / `useForwardPropsEmits` 转发模式规范
- `Primitive` 的 `as` / `asChild` 多态渲染使用正确
- 未发现已废弃 API

### Tailwind CSS 兼容性

**评价：✅ 良好**

- 使用 Tailwind CSS v4（`@tailwindcss/postcss: ^4.3.0`）
- 全部使用标准 utility class，无 v3 遗留语法（无 `@apply` 指令）
- `tailwind-merge: ^3.6.0` 与 v4 兼容
- 自定义工具类（`shadow-brutal`、`rounded-brutal`、`animate-accordion-*` 等）需库的 `styles.css` 提供

### SSR 安全性

**评价：⚠️ 有问题**

5 个组件直接访问浏览器全局 API 无守卫：

| 组件 | API | 状态 |
|------|-----|------|
| HardcoreInput | `window.setTimeout` | ❌ 无守卫 |
| Toast | `window.setTimeout` | ❌ 无守卫 |
| TreeSelectNode | `document.activeElement` | ❌ 无守卫 |
| TreeView | `document.activeElement` | ❌ 无守卫 |
| DialogEnhanced | `document.addEventListener` | ❌ 无守卫 |
| useColorHistory | `window.localStorage` | ✅ 已有守卫 |
| useAudioEngine | `AudioContext` | ✅ 已有守卫 |
| useClipboard | `navigator.clipboard` | ✅ 已有守卫（通过 `isSupported` 间接保护） |
| useReducedMotion | `window.matchMedia` | ✅ 已有守卫 |
| useToast | `window.setTimeout` | ✅ 已有守卫 |

### 可选依赖处理

**评价：❌ 严重**

| 依赖 | 状态 | 问题 |
|------|------|------|
| `vee-validate` | optional peerDep | Form/FormField 顶层静态导入，未安装时崩溃 |
| `prismjs` | optional peerDep | CodeBlock 顶层静态导入，未安装时崩溃 |
| `zod` | optional peerDep | 仅类型导入，编译后擦除，无问题 |
| `v-calendar` | dependency | 打入产物，包体积增大 |

### 浏览器 API 兼容性

**评价：✅ 良好**

- Canvas API（scratch-card）：使用正确，有 SSR 守卫
- Web Audio API（useAudioEngine）：有 webkit 前缀降级 `AudioContext ?? webkitAudioContext`
- Clipboard API（useClipboard）：有 `isSupported` 检测
- Pointer Events（ColorPickerPanel）：`setPointerCapture`/`releasePointerCapture` 有 try-catch 保护
- ResizeObserver（counter、useCanvasInteraction）：在 `onUnmounted` 中正确断开
- Intl.ListFormat（TreeSelect）：已有特性检测和回退

### 内存泄漏风险

**评价：✅ 良好**

所有涉及以下资源的组件/composable 均在 `onUnmounted` / `onScopeDispose` 中正确清理：

| 资源类型 | 组件/composable | 清理方式 |
|---------|----------------|---------|
| `setInterval` / `setTimeout` | glitch-button、typewriter-text、useToast、useClipboard | `onUnmounted` 中 `clearInterval`/`clearTimeout` |
| `requestAnimationFrame` | noise-background、counter | `onUnmounted` 中 `cancelAnimationFrame` |
| `MediaQueryList` 事件 | useReducedMotion、useTheme | `onUnmounted` 中 `removeEventListener` |
| `ResizeObserver` | counter、useCanvasInteraction | `onUnmounted` 中 `disconnect()` |
| Pointer Events | useCanvasInteraction | `releasePointerCapture` + try-catch |
| embla-carousel 事件 | useCarousel | `onUnmounted` 中 `off()` |
| AudioContext | useAudioEngine | `onUnmounted` 中 `close()` |

### 无障碍性

**评价：✅ 良好**

- reka-ui 原语自动处理焦点陷阱、Escape 关闭、Tab 导航、ARIA 属性
- 手动补充：`role="status"`（spinner）、`role="group"`（command-group）、`role="separator"`（command-separator）、`role="searchbox"`（command-input）、`role="tablist"`/`role="tab"`（pricing-section）
- `sr-only` 文本：关闭按钮、面包屑省略号、spinner 加载提示
- `aria-label` 通过 `useLocale()` 国际化
- `aria-current="page"` / `aria-current="step"` 使用正确
- Stepper 实现完整键盘导航（Arrow/Home/End）
- 轻微不足：Toast 的 `aria-live="off"` 过于保守

### z-index 管理

**评价：⚠️ 一般**

所有弹窗/浮层组件统一使用 `z-50`，当前一致性良好。但：
- 无 z-index 配置能力
- 嵌套弹窗场景（如 Dialog 内打开 DropdownMenu）可能需要不同层级
- 建议后续提供 z-index 配置或分层策略

---

## 五、问题统计

| 严重级别 | 数量 | 描述 |
|---------|------|------|
| **严重（P0）** | 5 | 可选依赖崩溃（2）、虚拟列表不响应（1）、类型重复（1）、依赖打入产物（1） |
| **中等（P1）** | 10 | SSR 不安全（5）、样式硬编码（1）、API 不一致（1）、逻辑重复（1）、图片无 fallback（1）、绕过 reka-ui（1） |
| **轻微（P2）** | 22 | 类型断言、风格不一致、魔法数字、aria-live 等 |

---

## 六、修复优先级路线图

### 第一阶段：关键修复（阻断性问题）

- [x] 将 vee-validate 改为 required peerDependency ✅ 2026-06-30
- [x] 将 prismjs 改为 required peerDependency ✅ 2026-06-30
- [x] 修复 VirtualScroll 的 `useVirtualizer` 参数为 getter 函数 ✅ 2026-06-30
- [x] 提取 `ChatMessage` 接口到独立 `types.ts` ✅ 2026-06-30
- [x] 将 v-calendar 从 dependency 移至 peerDependencies ✅ 2026-06-30

### 第二阶段：重要修复（影响质量）

- [x] 为 HardcoreInput、Toast、TreeSelectNode、TreeView、DialogEnhanced 添加 SSR 安全守卫 ✅ 2026-06-30
- [x] 统一 DropdownMenuSubContent 样式复用 ✅ 2026-06-30
- [x] 统一 DatePicker 系列的受控 open 模式 ✅ 2026-06-30
- [ ] 重构 CarouselEnhanced 使用 useCarousel composable
- [x] 为 GallerySection/ChatBubble 的 `<img>` 添加 `@error` fallback ✅ 2026-06-30

### 第三阶段：优化打磨（提升一致性）

- [x] 清理类型断言（RadioGroup、Tabs、ToggleGroup、DataTableSection）✅ 2026-06-30
- [x] 统一路径别名风格（FormWizard 的 `@/` 改为相对路径）✅ 2026-06-30
- [x] 提取魔法数字（CarouselEnhanced 的 `progressInterval`）✅ 2026-06-30
- [x] 改善 aria-live 策略（Toast 从 `off` 改为 `polite`）✅ 2026-06-30
- [x] 统一 inject fallback 模式（Accordion）✅ 2026-06-30
- [ ] 验证并移除 `@ts-expect-error`（Carousel）
