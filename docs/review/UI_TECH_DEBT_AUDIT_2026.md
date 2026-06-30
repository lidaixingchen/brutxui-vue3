# packages/ui 技术债综合审查报告

> **审查日期**：2026-06-30
> **项目版本**：v0.8.1
> **审查范围**：packages/ui/src — 215 个 Vue 组件，200+ 个 TypeScript 文件，93 个组件目录
> **审查维度**：TypeScript 类型安全、Vue 3 最佳实践、可访问性与兼容性、代码一致性、错误处理、组件架构

---

## 一、总体评估

| 维度 | 评级 | 说明 |
| ---- | ---- | ---- |
| TypeScript 类型安全 | ✅ 良好 | 生产代码零 `any` 使用，仅 1 处 `@ts-expect-error` |
| Vue 3 最佳实践 | ✅ 优秀 | 全部使用 Composition API，无废弃 API，emit/props 类型完整 |
| 可访问性 | ⚠️ 中等 | 复杂组件优秀，但部分交互元素缺少键盘支持 |
| 代码一致性 | ✅ 良好 | 命名规范统一，仅变体定义有 1 处不一致 |
| 错误处理 | ⚠️ 中等 | 大部分良好，但存在空 catch 块静默吞没错误的情况 |

**问题统计**：

| 类别 | 高 | 中 | 低 | 信息 | 合计 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| TypeScript 类型安全 | 1 | 3 | 4 | 1 | 9 |
| Vue 3 最佳实践 | 0 | 2 | 1 | 0 | 3 |
| 可访问性/兼容性 | 2 | 5 | 3 | 1 | 11 |
| 错误处理 | 1 | 0 | 2 | 1 | 4 |
| 组件架构/一致性 | 0 | 6 | 0 | 0 | 6 |
| **合计** | **4** | **16** | **10** | **3** | **33** |

---

## 二、高严重度问题（需优先修复）

### 2.1 GallerySection 可点击 div 缺少键盘和语义化支持

**严重程度**：🔴 高
**文件**：`packages/ui/src/components/gallery-section/GallerySection.vue:66-69`

**问题描述**：`<div>` 有 `cursor-pointer` 和 `@click`，但**没有** `tabindex`、`role="button"` 或键盘事件。这是最严重的可访问性屏障。

```html
<!-- 当前 -->
<div
    class="flex flex-col items-center justify-center p-4 cursor-pointer ..."
    @click="handleItemClick(index)"
>

<!-- 修复 -->
<div
    class="flex flex-col items-center justify-center p-4 cursor-pointer ..."
    role="button"
    tabindex="0"
    @click="handleItemClick(index)"
    @keydown.enter="handleItemClick(index)"
    @keydown.space.prevent="handleItemClick(index)"
>
```

**预估工作量**：15 分钟

---

### 2.2 Canvas context 创建错误被静默吞没

**严重程度**：🔴 高
**文件**：`packages/ui/src/composables/useCanvasInteraction.ts:73`

**问题描述**：空 catch 块静默吞没了 `getContext('2d')` 的失败，无日志、无降级处理。若 Canvas 不可用，组件将无声失败。

```typescript
// 当前
try { ... getContext('2d') ... } catch {}

// 建议：添加 console.warn 或设置 fallback 标志
try { ... } catch {
  console.warn('Canvas 2D context is not available')
}
```

**预估工作量**：10 分钟

---

### 2.3 VirtualScroll 双重类型断言

**严重程度**：🔴 高
**文件**：`packages/ui/src/components/virtual-scroll/VirtualScroll.vue:41`

**问题描述**：`as unknown as` 绕过类型检查链，如果底层库返回类型变化，运行时才会崩溃。

```typescript
// 当前
virtualizerRef = useVirtualizerFn(virtualizerOptions) as unknown as ReturnType<UseVirtualizerFn>

// 建议：检查 useVirtualizerFn 的实际返回类型，修正类型定义
```

**预估工作量**：30 分钟

---

### 2.4 Dialog/Sheet 焦点陷阱实现需验证

**严重程度**：🔴 高
**文件**：`packages/ui/src/components/dialog/DialogContent.vue`、`packages/ui/src/components/sheet/SheetContent.vue`

**问题描述**：DialogEnhanced 中的 sr-only 关闭按钮是好的做法，但焦点恢复逻辑需人工验证。

**验证任务**（需手动测试确认）：

1. 打开 Dialog/Sheet 后，焦点是否移动到弹窗内
2. 关闭弹窗后，焦点是否恢复到触发按钮
3. 使用 Escape 键关闭时，焦点恢复是否正常
4. 多层弹窗嵌套时，焦点恢复是否正确

**验收标准**：

- [ ] Tab 键可将焦点移入弹窗
- [ ] Shift+Tab 可将焦点移出弹窗（循环）
- [ ] 关闭后焦点恢复到触发元素
- [ ] 屏幕阅读器正确播报弹窗状态

**建议**：先手动测试，若发现问题再创建修复任务；若通过则标记为已验证。

---

### 2.5 DataTableSection 行和列头缺少键盘导航

**严重程度**：🔴 高
**文件**：`packages/ui/src/components/data-table-section/DataTableSection.vue:146-169`

**问题描述**：TableRow 有 `@click` 但无 `tabindex` 或 `@keydown`，与 DataTable 组件的实现不一致。

```html
<!-- 当前 -->
<TableRow
    v-for="(row, rowIndex) in paginatedRows"
    class="cursor-pointer active:translate-y-[...] transition-all"
    @click="handleRowClick(row)"
>

<!-- 修复 -->
<TableRow
    v-for="(row, rowIndex) in paginatedRows"
    class="cursor-pointer active:translate-y-[...] transition-all"
    tabindex="0"
    @click="handleRowClick(row)"
    @keydown.enter="handleRowClick(row)"
>
```

**预估工作量**：30 分钟

---

### 2.6 useTheme.ts 类型断言不安全

**严重程度**：🔴 高
**文件**：`packages/ui/src/composables/useTheme.ts:112,117`

**问题描述**：虽有 `VALID_THEMES.includes()` 检查，但 `includes` 参数类型不保证 narrowing。

```typescript
// 当前
savedThemeRaw as ThemeName  // string | null → ThemeName

// 建议：使用类型守卫函数
function isValidTheme(value: string | null): value is ThemeName {
  return value !== null && VALID_THEMES.includes(value as ThemeName)
}
```

**预估工作量**：20 分钟

---

## 三、中严重度问题

### 3.1 CarouselEnhanced 暴露内部实现

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/carousel/CarouselEnhanced.vue:123`

**问题描述**：`defineExpose` 中包含 `emblaRef`，泄露了底层库的内部引用，破坏封装性。

**建议**：移除 `emblaRef`，或提供更高级别的抽象方法。

---

### 3.2 breadcrumb-variants.ts 使用纯字符串而非 cva

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/breadcrumb/breadcrumb-variants.ts`

**问题描述**：62 个变体文件中唯一一个不使用 `cva()` 的，导致无法通过 variant props 控制样式。

**建议**：重构为 `cva()` 模式，与其他 61 个变体文件保持一致。

---

### 3.3 缺少全局 reduced-motion 兜底策略

**严重程度**：🟡 中
**影响范围**：119 处 transition/animation 使用

**问题描述**：仅 9 个组件实现了 `useReducedMotion()` 检查，其余组件未处理。

**建议**：在全局 CSS 中添加兜底规则：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 3.4 表单缺少 aria-errormessage

**严重程度**：🟡 中
**文件**：`Input.vue`、`Textarea.vue`、`HardcoreInput.vue`

**问题描述**：使用 `aria-invalid` 但未使用 `aria-errormessage` 关联错误消息元素。

**建议**：在有 `aria-invalid` 的同时，添加 `aria-errormessage` 指向错误消息元素的 id。

---

### 3.5 FeedbackForm 缺少表单验证的可访问性支持

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/feedback-form/FeedbackForm.vue:144-164`

**问题描述**：使用了正确的 `<label for="...">` 模式，但未见 `aria-required`、`aria-invalid` 或错误消息的可访问性关联。

---

### 3.6 Stepper 焦点管理不完整

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/stepper/Stepper.vue:100`

**问题描述**：缺少对 Home/End 键的支持（仅处理了 ArrowLeft/ArrowRight），且没有实现 roving tabindex 模式。

---

### 3.7 Combobox 和 DatePicker 弹出面板焦点管理

**严重程度**：🟡 中
**影响范围**：Combobox、ComboboxMulti、所有 DatePicker 系列组件

**问题描述**：使用了 `role="combobox"` 和 `aria-expanded`，但弹出面板中的选项焦点管理需确认是否通过底层库（reka-ui）正确处理。

---

### 3.8 OverviewPage 可点击 div 缺少 role="button"

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/overview-page/OverviewPage.vue:83`

**问题描述**：已有 `tabindex` 和 `@keydown.enter`，但缺少 `role="button"` 属性。

**修复**：添加 `role="button"` 即可。

---

### 3.9 Card3D clickable 模式缺少无障碍支持

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/card-3d/Card3D.vue:160`

**问题描述**：当 `clickable=true` 时绑定了 `@click`，但无动态 `role`、`tabindex`、键盘事件。

**修复**：根据 `clickable` prop 动态添加 `role="button" tabindex="0" @keydown.enter="handleClick"`。

---

### 3.10 输入框缺少替代焦点指示器

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/tags-input/TagsInputInput.vue:15`、`packages/ui/src/components/number-input/number-input-variants.ts:55`

**问题描述**：使用 `focus:outline-none` 但未提供 `focus:ring` 或 `focus:shadow` 替代样式。

**修复**：添加 `focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2`。

---

### 3.11 ColorPickerPanel 硬编码颜色值

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/color-picker/ColorPickerPanel.vue:297-315`

**问题描述**：内联 style 中硬编码了 `#fff`、`#000`、`#f00`、`#ff0`、`#0f0`、`#0ff`、`#00f`、`#f0f` 等颜色值。

**修复**：抽取为命名常量如 `SV_GRADIENT_WHITE`、`HUE_SPECTRUM_GRADIENT` 等。

---

### 3.12 TreeSelectNode 重复的 document.activeElement 类型断言

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/tree-select/TreeSelectNode.vue:80,90,100`

**问题描述**：同一文件 3 处重复 `document.activeElement as HTMLElement | null`。

**修复**：抽取 `getActiveElement(): HTMLElement | null` 辅助函数。

---

### 3.13 FormWizard composable 内联在 .vue 文件中

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/form/FormWizard.vue:1-25`

**问题描述**：唯一使用非 setup `<script>` 块导出 composable 的组件，违反关注点分离。

**修复**：将 `useFormWizard()` 和 `formWizardContextKey` 移至独立 `.ts` 文件。

---

### 3.14 DatePicker Props 命名不一致

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/date-picker/` 下 5 个组件

**问题描述**：使用 `interface Props` 而非项目标准 `interface ComponentNameProps`。

**修复**：重命名为 `DatePickerRangeProps`、`DateTimePickerProps` 等。

---

### 3.15 导入路径风格混用

**严重程度**：🟡 中
**影响范围**：15+ 个组件文件

**问题描述**：同一文件内混用 `@/composables/...`（别名）和 `../../lib/utils`（相对路径）。

**修复**：统一为全部使用 `@/` 别名或全部使用相对路径。

---

### 3.16 Form.vue watch deep 潜在性能问题

**严重程度**：🟡 中
**文件**：`packages/ui/src/components/form/Form.vue:39`

**问题描述**：对 `initialValues` 使用 `{ deep: true }`，对象层级深时有性能开销。

**建议**：考虑使用 `JSON.stringify` 比较或限制监听深度。实际影响有限（有 dirty 状态守卫），但属于不良实践。

---

## 四、低严重度问题

### 4.1 onUnmounted vs onBeforeUnmount

**严重程度**：🟢 低
**影响范围**：11 个组件

**问题描述**：在 `onUnmounted` 中执行清理，应改为 `onBeforeUnmount`（DOM 元素仍可访问）。

**涉及组件**：

- Counter.vue
- DialogEnhanced.vue
- GlitchButton.vue
- GlitchText.vue
- HardcoreInput.vue
- NoiseBackground.vue
- Toast.vue
- TypewriterText.vue
- VirtualScroll.vue
- CommandGroup.vue
- CommandItem.vue

---

### 4.2 12/93 组件目录有本地 index.ts

**严重程度**：🟢 低
**影响范围**：12 个目录

**问题描述**：仅 12 个目录有 `index.ts`，其余 81 个没有。建议统一：全部添加或全部移除。

**有 index.ts 的目录**：
counter、kanban、kbd、stepper、noise-background、tree-select、typewriter-text、glitch-button、virtual-scroll、tree-view、chat-bubble、carousel

---

### 4.3 魔法数字残留

**严重程度**：🟢 低
**影响范围**：约 15 处

**问题描述**：项目已有 `defaults.ts` 集中常量的良好模式，但仍有少量内联数字。

**示例**：

- Card3D: `perspective: 1000`
- SketchyChart: `width: 600, height: 400`
- Slider/Progress: `max: 100`
- date.ts: 年份截止阈值 `50`

---

### 4.4 KanbanBoard.test.ts 命名不一致

**严重程度**：🟢 低
**文件**：`packages/ui/src/components/kanban/KanbanBoard.test.ts`

**问题描述**：唯一使用 PascalCase 的测试文件，其余 108 个均使用 kebab-case。

---

### 4.5 TreeSelect 清除按钮使用 span + role="button"

**严重程度**：🟢 低
**文件**：`packages/ui/src/components/tree-select/TreeSelect.vue:323-333`

**问题描述**：原生 `<button>` 仍然是更优选择，天然支持 Enter/Space 键、焦点样式和屏幕阅读器语义。

---

### 4.6 Toggle 和 Switch 缺少 sr-only 文本

**严重程度**：🟢 低
**文件**：`Toggle.vue:60`

**问题描述**：使用了 `aria-label` 但没有 sr-only 类作为后备。

---

### 4.7 CookieConsent 的 Vue transition 动画没有处理 reduced motion

**严重程度**：🟢 低
**文件**：`packages/ui/src/components/cookie-consent/CookieConsent.vue:75-76`

---

### 4.8 PointerCapture 空 catch 块缺少注释

**严重程度**：🟢 低
**文件**：`packages/ui/src/composables/useCanvasInteraction.ts:183,200`、`packages/ui/src/components/color-picker/ColorPickerPanel.vue:154`

**问题描述**：`setPointerCapture`/`releasePointerCapture` 的空 catch 属于安全降级但缺少注释。

**修复**：添加 `// Pointer may already be captured/released` 注释。

---

### 4.9 useColorHistory localStorage 空 catch

**严重程度**：🟢 低
**文件**：`packages/ui/src/composables/useColorHistory.ts:31`

**问题描述**：localStorage 操作的空 catch，无日志。

**修复**：添加 `console.warn` 或注释说明。

---

## 五、信息级别问题

### 5.1 日期组件 polyfill catch 缺少注释

**严重程度**：ℹ️ 信息
**文件**：Calendar.vue:8、DatePickerPanel.vue:8、WeekPickerPanel.vue:8、DateTimePickerPanel.vue:9、DatePickerRangePanel.vue:9、prism-languages.ts:92

**问题描述**：动态 import polyfill 的空 catch 块属于预期行为，但缺少注释说明。

**修复**：添加 `// Optional polyfill, safe to ignore if unavailable` 注释。

---

### 5.2 @ts-expect-error 抑制

**严重程度**：ℹ️ 信息
**文件**：`packages/ui/src/components/carousel/Carousel.vue:31`

**问题描述**：vue-tsc 对字符串模板 ref 的已知误报，`@ts-expect-error` 抑制合理且有说明注释。

**修复**：无需修改，等待 vue-tsc 上游修复。

---

## 六、TypeScript 类型安全详情

### 6.1 any 类型使用

**生产代码**：0 处 ✅
**测试代码**：2 处（均有 eslint-disable 注释）

| 文件 | 行号 | 说明 |
| ---- | ---- | ---- |
| `data-table-section.test.ts` | 30 | Vue 泛型组件测试挂载的已知 workaround |
| `data-table.test.ts` | 32 | 同上 |

### 6.2 TypeScript 忽略指令

**总数**：1 处

| 文件 | 行号 | 说明 |
| ---- | ---- | ---- |
| `Carousel.vue` | 31 | vue-tsc 对字符串模板 ref 的已知识别限制，有注释说明 |

### 6.3 类型断言分布

| 类别 | 生产代码 | 测试代码 |
| ---- | -------- | -------- |
| `as` 断言 | ~30 处 | ~220 处 |
| `as unknown as` 双重断言 | 1 处 | ~28 处 |

**高风险断言**：

- `VirtualScroll.vue:41` — `as unknown as ReturnType<UseVirtualizerFn>`
- `useTheme.ts:112,117` — `string | null` 直接断言为联合类型
- `prism-languages.ts:4-5` — `globalThis` 断言

---

## 七、Vue 3 最佳实践详情

### 7.1 通过项

| 检查项 | 状态 | 说明 |
| -------- | ---- | ---- |
| 废弃 API（$listeners、$children） | ✅ 通过 | 无使用 |
| Emit 类型定义 | ✅ 通过 | 全部使用 TypeScript 泛型语法 |
| Props 定义模式 | ✅ 通过 | 统一使用 `defineProps<T>()` 或 `withDefaults` |
| 深度监听 | ✅ 通过 | 仅 1 处合理使用（Form.vue） |
| Options API | ✅ 通过 | 全部使用 `<script setup>` |

### 7.2 生命周期钩子

11 个组件在 `onUnmounted` 中执行清理，建议改为 `onBeforeUnmount`。所有清理逻辑本身是正确的（定时器取消、事件监听移除、Observer 断开）。

---

## 八、可访问性详情

### 8.1 做得好的方面

- **ARIA 属性**：303 次使用，覆盖 87 个文件
- **键盘导航**：55 次使用，覆盖 20 个文件
- **屏幕阅读器支持**：所有 Spinner 组件包含 `sr-only` 文本
- **复杂组件**：TreeSelect、TreeView 实现了完整的 roving tabindex 模式
- **Reduced Motion**：9 个关键动画组件实现了 `useReducedMotion()` 检查

### 8.2 需要改进的方面

| 类别 | 高 | 中 | 低 |
| ---- | ---- | ---- | ---- |
| ARIA 属性 | 0 | 1 | 2 |
| 键盘导航 | 1 | 2 | 1 |
| 焦点管理 | 1 | 2 | 0 |
| 动画/Reduced Motion | 0 | 2 | 1 |
| 表单可访问性 | 0 | 1 | 1 |
| sr-only 文本 | 0 | 0 | 2 |
| 语义化问题 | 1 | 0 | 3 |

---

## 九、代码一致性详情

### 9.1 通过项

| 检查项 | 状态 | 说明 |
| -------- | ---- | ---- |
| 导出模式 | ✅ 统一 | 集中 barrel file 重导出 |
| 组件 API 风格 | ✅ 统一 | 全部使用 `<script setup>` Composition API |
| 变体工具 | ✅ 统一 | 61/62 使用 `cva`（breadcrumb 例外） |
| 样式处理 | ✅ 统一 | `:class` 用于计算类，`:style` 用于动态值 |
| 目录命名 | ✅ 统一 | 全部 kebab-case |
| Vue 文件命名 | ✅ 统一 | 全部 PascalCase |
| 测试覆盖 | ✅ 完整 | 93/93 组件目录有测试文件 |

### 9.2 不一致项

| 问题 | 严重程度 | 影响范围 |
| ---- | -------- | -------- |
| breadcrumb-variants.ts 使用纯字符串 | 中 | 1 个组件 |
| DatePicker Props 命名不一致 | 中 | 5 个组件 |
| 导入路径风格混用 | 中 | 15+ 个文件 |
| 12/93 目录有本地 index.ts | 低 | 12 个目录 |
| KanbanBoard.test.ts 命名不一致 | 低 | 1 个文件 |

---

## 十、修复优先级与工作量估算

| 优先级 | 问题 | 预估工作量 |
| ------ | ---- | ---------- |
| P0 | GallerySection 键盘/语义化支持 | 15 分钟 |
| P0 | Canvas context 错误处理 | 10 分钟 |
| P0 | VirtualScroll 双重断言重构 | 30 分钟 |
| P0 | DataTableSection 键盘导航 | 30 分钟 |
| P1 | useTheme 类型守卫 | 20 分钟 |
| P1 | CarouselEnhanced 移除 emblaRef 暴露 | 5 分钟 |
| P1 | breadcrumb-variants 重构为 cva | 30 分钟 |
| P1 | Dialog/Sheet 焦点恢复验证 | 30 分钟 |
| P1 | OverviewPage 添加 role="button" | 5 分钟 |
| P1 | Card3D clickable 无障碍支持 | 15 分钟 |
| P1 | 输入框焦点指示器 | 15 分钟 |
| P2 | 全局 reduced-motion CSS | 10 分钟 |
| P2 | 表单 aria-errormessage | 30 分钟 |
| P2 | FeedbackForm 可访问性增强 | 20 分钟 |
| P2 | Stepper 焦点管理完善 | 20 分钟 |
| P2 | ColorPickerPanel 颜色常量提取 | 15 分钟 |
| P2 | TreeSelectNode 辅助函数抽取 | 10 分钟 |
| P2 | FormWizard composable 提取 | 15 分钟 |
| P2 | DatePicker Props 命名统一 | 15 分钟 |
| P2 | 导入路径风格统一 | 20 分钟 |
| P3 | onUnmounted → onBeforeUnmount 批量替换 | 20 分钟 |
| P3 | index.ts 统一 | 15 分钟 |
| P3 | 魔法数字提取 | 20 分钟 |
| P3 | KanbanBoard.test.ts 重命名 | 2 分钟 |
| P3 | 空 catch 块添加注释 | 10 分钟 |

**总预估工作量**：~7 小时

---

## 十一、长期建议

1. **ESLint 规则**：添加 `@typescript-eslint/consistent-type-assertions` 规则，禁止 `as unknown as T` 双重断言
2. **全局 CSS 兜底**：添加 `@media (prefers-reduced-motion: reduce)` 全局规则
3. **可访问性测试**：在 CI 中添加 axe-core 或类似工具的自动化检查
4. **常量集中管理**：将分散在各组件的默认值常量统一到 `lib/defaults.ts`
5. **导入路径规范**：配置 ESLint 的 `import/no-relative-parent-imports` 或类似规则统一路径风格
6. **季度审查**：建议每季度进行一次技术债审查

---

**报告生成时间**：2026-06-30
**下次建议审查时间**：2026-09-30
