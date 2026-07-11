# BrutxUI Vue 3 — UI 包全面 Bug 扫描报告

> **扫描日期**：2026-07-11
> **审查范围**：`packages/ui/src/` 全部组件、composables、lib 工具函数、指令、顶层入口文件
> **扫描方式**：人工源码审查（未运行静态检查工具）
> **审查文件数**：约 280 个源文件（不含 `.test.ts`）

---

## 一、摘要

本次全面扫描共发现 **41 项** bug，按严重程度分布如下：

| 严重程度 | 数量 | 说明 |
|----------|------|------|
| Critical | 1 | 功能完全失效 |
| High | 4 | 严重功能缺陷或数据损坏 |
| Medium | 12 | 明确的逻辑错误或可访问性问题 |
| Low | 24 | 边缘场景、性能、代码质量 |

按类别分布：

| 类别 | 数量 |
|------|------|
| 内存泄漏 / 生命周期清理 | 8 |
| 竞态条件 | 6 |
| 逻辑错误 | 8 |
| 可访问性 (a11y) | 6 |
| 类型安全 | 3 |
| v-model / 响应式 | 4 |
| 性能 | 3 |
| i18n / 硬编码 | 2 |
| 事件处理 | 1 |

**总体评估**：项目整体代码质量较高，composables 的生命周期清理（onUnmounted/onScopeDispose）和 SSR 守卫（isClient/hasDocument）执行良好。主要风险集中在 **Toast 双定时器冲突**、**DataTable spanMethod 失效**、**Upload 重试竞态** 三个高影响面。

---

## 二、Critical 级别

### C-1: DataTable `spanMethod` 完全失效 — rowspan/colspan 绑定到 `:style` 而非 HTML 属性

- **文件**：[DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L699-L705)
- **类别**：逻辑错误 / DOM 绑定
- **描述**：`rowspan` 和 `colspan` 被放在 `:style` 绑定中（作为 CSS 属性，浏览器忽略），而非通过 `:rowspan` / `:colspan` 作为 HTML 属性绑定。结果：需要合并的单元格永不合并，需要隐藏的单元格（`[0, 0]`）通过 `v-show` 隐藏后留下视觉空洞。

```vue
:style="{
    ...(getSpanMethodResult(...) ? {
        rowspan: getSpanMethodResult(...)[0],   // CSS 属性 — 无效
        colspan: getSpanMethodResult(...)[1],   // CSS 属性 — 无效
    } : {}),
}"
```

**修复建议**：将 `rowspan`/`colspan` 移出 `:style`，改为独立属性绑定 `:rowspan` / `:colspan`，并将 `getSpanMethodResult` 调用结果缓存到局部变量（当前每个单元格调用 6 次）。

---

## 三、High 级别

### H-1: Toast 双定时器冲突 — 离场动画永不着火，`pauseOnHover` 完全失效

- **文件**：[useToast.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useToast.ts#L97-L115) + [Toast.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/toast/Toast.vue#L59-L89)
- **类别**：竞态条件 / 逻辑错误
- **描述**：`useToast.addToast` 在 toast 入数组时立即启动 `setTimeout(removeToast, duration)`；`Toast.vue.onMounted` 又独立启动 `setTimeout(startLeave, duration)`。由于 `useToast` 的定时器先注册，它先触发并从数组移除 toast，导致 `Toast.vue` 被卸载，离场动画永不着火。此外，`useToast` 的定时器无暂停/恢复机制，`pauseOnHover` 仅暂停 `Toast.vue` 的定时器，`useToast` 继续倒计时并在用户悬停时移除 toast。

**修复建议**：移除 `useToast` 内部定时器，改由 `Toast.vue` 的 `close` 事件触发 `removeToast`；或在 `useToast` 定时器中增加 `LEAVE_ANIMATION_DELAY` 延迟。

### H-2: 持久化 Toast（`duration: 0`）在鼠标移出时关闭

- **文件**：[Toast.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/toast/Toast.vue#L74-L82)
- **类别**：逻辑错误
- **描述**：`duration: 0` 用于持久化/loading toast（见 `useToast.ts` promise API）。`onMounted` 正确跳过启动定时器（`if (props.duration)`），但 `resumeTimer()` 的守卫 `if (isLeaving.value || timer.value) return` 通过（`timer.value` 为 undefined），随后 `if (remainingTime.value <= 0)` 判定为 `0 <= 0 → true`，调用 `startLeave()` 关闭 toast。用户悬停后移出鼠标时，持久化 loading toast 消失。

**修复建议**：在 `resumeTimer` 和 `onMouseLeave` 中增加 `if (!props.duration) return` 早返回。

### H-3: Counter 缩放测量使用当前内容宽度而非容器可用宽度

- **文件**：[Counter.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/counter/Counter.vue#L134-L145)
- **类别**：逻辑错误
- **描述**：`updateScale()` 中 `constrainedWidth = root.clientWidth`，但 `rootRef` 是显示**当前动画值**（如 "0"）的内层 span，而非容器。从短值（"0"）动画到长值（"1,000,000"）时，即使容器足够宽，缩放比例仍按 `width("0") / width("1,000,000")` 计算，导致文字被缩到几乎不可见。ResizeObserver 在动画过程中反复触发，产生视觉抖动。

**修复建议**：`const constrainedWidth = root.parentElement?.clientWidth ?? root.clientWidth`

### H-4: Upload `retryUpload` 竞态 — 产生孤儿 AbortController

- **文件**：[Upload.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/upload/Upload.vue#L153-L160)
- **类别**：竞态条件 / 文件上传
- **描述**：`retryUpload` 不检查 `file.status === 'uploading'`。若在前次上传进行中调用重试，`doUpload` 创建新 `AbortController` 并覆盖 `file.abortController`，前次上传变为孤儿——无法中止、onProgress 回调竞争（进度条闪烁）、可能产生重复的 `file-success`/`file-error` 事件。

**修复建议**：重试前先中止在途上传：`if (file.status === 'uploading') file.abortController?.abort()`

---

## 四、Medium 级别

### M-1: FormControl slot props 不会自动应用到子元素 — 可访问性属性丢失

- **文件**：[FormControl.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/form/FormControl.vue#L24-L31)
- **类别**：可访问性 / 逻辑错误
- **描述**：`<slot :id="..." :aria-describedby="..." :aria-invalid="..." />` 传递的是 slot props，Vue 3 中不会自动应用到 slotted 子元素，除非消费者使用 `v-slot="props"` + `v-bind="props"`。标准用法 `<FormControl><Input /></FormControl>` 静默丢弃 `id`、`aria-describedby`、`aria-invalid`，`FormLabel` 的 `for` 属性无法匹配任何元素，破坏 label-input 关联。

**修复建议**：使用 reka-ui 的 `Primitive` + `as-child` 合并属性到子元素，或文档说明需用 scoped slot。

### M-2: FormWizard `completedSteps` 在数据变更时未失效

- **文件**：[FormWizard.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/form/FormWizard.vue#L59-L99)
- **类别**：逻辑错误（状态转换）
- **描述**：`watch(modelValue)` 清除 `stepErrors` 但未清除 `completedSteps`。用户完成步骤 0 → 返回修改数据使其无效 → 点击步骤 2 指示器 → 线性检查仅看 `completedSteps`（仍含步骤 0）→ 导航通过已失效步骤。

**修复建议**：在 modelValue watcher 中同时 `completedSteps.value.delete(currentStep.value)`。

### M-3: useKanban `onDragEnd` 孤儿 rAF 覆盖 `isDragging`

- **文件**：[useKanban.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useKanban.ts#L49-L66)
- **类别**：竞态条件 / 生命周期
- **描述**：`onDragEnd` 调度 rAF 延迟设置 `isDragging = false`，但未取消先前排队的 rAF。连续两次 `onDragEnd` 后再 `onDragStart`，较早的孤儿 rAF 触发并将 `isDragging` 设为 `false`，覆盖刚设的 `true`。

**修复建议**：`onDragEnd` 开头先 `if (dragEndRafId !== null) cancelAnimationFrame(dragEndRafId)`。

### M-4: useDialog `show` 多次调用导致前序 dialog 实例泄漏

- **文件**：[useDialog.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialog.ts#L19-L40)
- **类别**：资源泄漏 / 生命周期
- **描述**：每次 `show` 覆盖 `currentInstance` 而不关闭前一个。`onUnmounted` 仅关闭最新的。若组件调用 `show` 两次，第一个 dialog 永不关闭，成为游离 DOM 节点。

**修复建议**：用 `Set` 跟踪所有打开的实例，或 `show` 时先关闭前一个。

### M-5: useStepper Home/End 键在线性模式下静默失效

- **文件**：[useStepper.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useStepper.ts#L33-L71)
- **类别**：逻辑错误 / 可访问性
- **描述**：`handleKeydown` 对 Home/End 调用 `goToStep(0)` / `goToStep(totalSteps - 1)`，但线性模式下 `goToStep` 拒绝 `Math.abs(index - currentStep) > 1` 的跳转。Home/End 键盘快捷键在线性模式下静默无操作，违反 WAI-ARIA stepper 模式预期。

**修复建议**：为 Home/End 跳过线性检查，或给 `goToStep` 增加 `force` 参数。

### M-6: SubMenu 水平模式下鼠标穿过间隙时下拉菜单关闭

- **文件**：[SubMenu.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/SubMenu.vue#L130-L134)
- **类别**：事件处理 / UX
- **描述**：水平模式中下拉 `<ul>` 用 `mt-1.5`（6px 上边距）定位，触发器与下拉间存在 6px 视觉间隙。鼠标穿过间隙时 `<li>` 的 `@mouseleave` 触发，`isOpened` 变 `false`，下拉菜单在鼠标到达前关闭。

**修复建议**：将 `mt-1.5` 改为在包裹元素上用 `pt-1.5` padding（保持悬停区域连续），或加关闭延迟。

### M-7: `showMessageBox` 硬编码中文错误信息

- **文件**：[functional.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/dialog/functional.ts#L246)
- **类别**：i18n / 硬编码
- **描述**：默认输入验证错误信息为 `'输入格式不正确'`，英文 locale 下仍显示中文，违反项目 i18n 体系和 AGENTS.md 的"无硬编码值"规则。

**修复建议**：使用 `t('messageBox.inputError')` 并添加 locale key。

### M-8: Tour 全局 `keydown` 监听拦截输入字段的 Enter/Escape

- **文件**：[Tour.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tour/Tour.vue#L321-L363)
- **类别**：可访问性 / 事件处理
- **描述**：`handleKeyDown` 绑定到 `window`，无 target 过滤。Tour 开启时，在页面任意 input 中按 Enter 会触发 `handleNextOrFinish()` 前进导览，按 Escape 会关闭导览，干扰用户与目标内输入元素的交互。

**修复建议**：检查 `e.target`，若来自 input/textarea/contenteditable 则跳过处理。

### M-9: GlitchText 自动播放定时器泄漏

- **文件**：[GlitchText.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/glitch-text/GlitchText.vue#L35-L44)
- **类别**：内存泄漏 / 动画
- **描述**：`setInterval` 回调每次创建新 `setTimeout` 赋给 `autoplayStopTimer.value` 但**未清除前一个**。项目的 `useGlitchEffect.ts`（L43-45）正确处理了此场景，但 `GlitchText.vue` 有重复的内联实现，与已修复的 composable 产生分歧。泄漏的 timeout 会在组件停止后仍触发 `isActive = false`。

**修复建议**：赋值前先 `clearTimeout(autoplayStopTimer.value)`，或直接复用 `useGlitchEffect` composable。

### M-10: TreeView `isUpdatingInternally` 标志在父组件不同步时卡住

- **文件**：[TreeView.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-view/TreeView.vue#L93-L110)
- **类别**：响应式 / v-model
- **描述**：`emitNodesUpdate()` 设 `isUpdatingInternally = true` 后 emit `update:nodes`。若父组件未绑定 `v-model:nodes`，emit 不引起 `props.nodes` 变化，watch 不触发，标志保持 `true`。下一次外部 `props.nodes` 变更被静默吞掉（watch 仅重置标志但不 clone）。

**修复建议**：仅当父组件实际监听 `update:nodes` 时才设标志：`const hasListener = !!getCurrentInstance()?.vnode.props?.['onUpdate:nodes']`。

### M-11: DataTable 可排序列头仅处理 Enter 键，不处理 Space

- **文件**：[DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L448-L624)
- **类别**：可访问性
- **描述**：可排序 `<th>` 有 `tabindex="0"` 和 `@keydown.enter` 但无 `@keydown.space`。键盘用户按 Space 触发页面滚动而非排序。

**修复建议**：添加 `@keydown.space.prevent="handleSort(column.id)"`。

### M-12: DataTable `expandRowKeys` watch 忽略 `undefined`

- **文件**：[DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L91-L95)
- **类别**：逻辑错误 / 响应式
- **描述**：`watch(expandRowKeys)` 仅在 `newKeys` 为 truthy 时更新内部 Set。父组件设回 `undefined` 以清除所有展开时，内部 Set 不清空，已展开行保持展开，与受控 prop 不一致。

**修复建议**：`expandedRowKeys.value = newKeys ? new Set(newKeys) : new Set()`

---

## 五、Low 级别

### 内存泄漏 / 生命周期

| # | 文件 | 描述 |
|---|------|------|
| L-1 | [useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L297-L308) | `initSize` 赋值 `sizeRafId = requestAnimationFrame(...)` 前未取消前一个 rAF，`onBeforeUnmount` 仅能取消最新 ID |
| L-2 | [useTheme.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useTheme.ts#L184-L206) | 单例 fallback 的 `matchMedia` listener 无组件级清理，仅靠 `beforeunload` 移除 |
| L-3 | [render-imperative.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/render-imperative.ts#L67-L72) | `destroy()` 中 `setTimeout(removeContainer, delay)` 未跟踪，页面导航后可能残留空 div（`container.remove()` 对已移除节点是 no-op，影响极小） |

### 竞态条件

| # | 文件 | 描述 |
|---|------|------|
| L-4 | [Tour.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tour/Tour.vue#L225-L358) | 快速点击 Next 时多个 `updatePosition()` 并发，无取消机制，可能闪烁错误步骤的高亮位置 |
| L-5 | [useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L266-L285) | `handleClose` 无并发守卫，快速触发关闭可导致 `beforeClose` 并发执行（重复 API 调用） |

### 逻辑错误

| # | 文件 | 描述 |
|---|------|------|
| L-6 | [Input.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/input/Input.vue#L228) / [Textarea.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/textarea/Textarea.vue#L92) | `compositionend` 仅设 `isComposing = false` 但不 emit 最终值，依赖后续 `input` 事件同步（现代浏览器通常触发，但边缘场景可能丢失） |
| L-7 | [Cascader.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/cascader/Cascader.vue#L381) | 预选值未找到时 `Math.max(0, -1)` 设 `activeItemIndex` 为 0，错误高亮首项 |
| L-8 | [InfiniteScroll.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/infinite-scroll/InfiniteScroll.vue#L99-L123) | `watch(disabled)` 从禁用转启用时不检查 `immediate`，与 `onMounted` 行为不一致 |
| L-9 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L247-L257) | `warnedColumns` Set 永不重置，列被动态移除再添加后警告不重现 |
| L-10 | [date.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/date.ts#L40) | `formatDate` 支持 `WW`（周数）token，但 `parseFormattedDate` 不支持，格式化/解析不对称 |

### 可访问性

| # | 文件 | 描述 |
|---|------|------|
| L-11 | [HardcoreInput.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/hardcore-input/HardcoreInput.vue#L103-L117) | 无 IME 组合处理（`compositionstart`/`compositionend`），CJK 输入时每个中间状态都 emit `update:modelValue` 并可能触发验证 |
| L-12 | [SelectTrigger.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/select/SelectTrigger.vue#L82-L101) | 清除按钮为 `<span role="button" tabindex="0">` 嵌套在 `<button>` 内，产生额外 tab stop |
| L-13 | [Rate.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/rate/Rate.vue#L86-L102) | 无 Home/End 键支持；值未变化时仍 emit `update:modelValue`（冗余事件） |
| L-14 | [MenuItem.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/MenuItem.vue#L77) / [SubMenu.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/SubMenu.vue#L206) | `@keydown.space` 无 `.prevent`，按 Space 激活菜单项时页面滚动 |

### 类型安全

| # | 文件 | 描述 |
|---|------|------|
| L-15 | [Combobox.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/combobox/Combobox.vue#L84-L149) | `props.modelValue as string[]` 不安全：若 `multiple=true` 但 `modelValue` 为 string，`String.prototype.includes` 做子串匹配而非精确匹配 |
| L-16 | [TreeSelectNode.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-select/TreeSelectNode.vue#L96) | `closest()` 返回 `Element \| null` 但直接 `as HTMLElement`，未做 `instanceof` 守卫 |

### v-model / 响应式

| # | 文件 | 描述 |
|---|------|------|
| L-17 | [TreeSelect.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-select/TreeSelect.vue#L94-L100) | `open` computed setter 在受控模式下仍更新 `internalOpen`，与 Combobox/Cascader 的 `if (props.open === undefined)` 守卫不一致 |
| L-18 | [useCarousel.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useCarousel.ts#L89-L103) | `onMounted` 在 `emblaApi.value` 为 null 时 early return 且无 `watch` 恢复路径，条件渲染（`v-if`）的轮播可能永不初始化 |
| L-19 | [useCarouselEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useCarouselEnhanced.ts#L40-L73) | 进度定时器不检查 autoplay 是否实际运行，`prefersReducedMotion` 时仍可能推进 `autoplayProgress` |

### 性能

| # | 文件 | 描述 |
|---|------|------|
| L-20 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L699-L705) | `getSpanMethodResult` 每个单元格每帧调用 6 次（3× in `:style`, 3× in `v-show`） |
| L-21 | [Upload.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/upload/Upload.vue#L72-L74) | `watch(fileList, ..., { deep: true })` 在上传进度更新时频繁触发并替换数组，大文件列表产生不必要重渲染 |

### 代码质量 / 硬编码

| # | 文件 | 描述 |
|---|------|------|
| L-22 | [useGlitchEffect.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useGlitchEffect.ts#L13-L14) | 本地常量 `MIN_AUTOPLAY_INTERVAL_MS = 100` 与 `defaults.ts` 的 `GLITCH_MIN_INTERVAL_MS = 50` 分歧 |
| L-23 | [useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L266-L285) | 用 `function.length` 区分 callback/Promise 模式不可靠：`(done = () => {}) => ...` 会被误判为 Promise 模式 |
| L-24 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L130-L475) | 魔法数字：`150`（列宽回退）、`'40px'`/`'48px'`（展开/选择列宽）、`48`（行高回退） |

---

## 六、修复优先级建议

### P0 — 立即修复（影响核心功能）

1. **C-1**：DataTable spanMethod 完全失效
2. **H-1**：Toast 双定时器冲突（离场动画 + pauseOnHover 失效）
3. **H-2**：持久化 Toast 在鼠标移出时关闭
4. **H-4**：Upload retryUpload 竞态（孤儿 AbortController）

### P1 — 尽快修复（影响用户体验）

5. **H-3**：Counter 缩放测量基准错误
6. **M-1**：FormControl 可访问性属性丢失
7. **M-7**：showMessageBox 硬编码中文
8. **M-8**：Tour 全局 keydown 拦截输入字段
9. **M-9**：GlitchText 定时器泄漏（已有 composable 修复可复用）
10. **M-10**：TreeView isUpdatingInternally 标志卡住

### P2 — 计划修复（边缘场景 / a11y 改进）

11. **M-2 ~ M-6, M-11, M-12**：各组件逻辑错误与 a11y 问题
12. **L-1 ~ L-24**：Low 级别问题

---

## 七、积极发现（无 bug 的区域）

以下文件经审查未发现 bug，代码质量良好：

- **Composables**：`useAudioEngine`、`useCanvasInteraction`、`useClipboard`、`useDebounce`、`useThrottle`、`useReducedMotion`、`useToast`（定时器逻辑本身）、`useMessage`、`useColorHistory`、`useFormFieldValidation` — 正确清理定时器、observer、audio context，SSR 守卫一致
- **组件**：`Checkbox`、`RadioGroup`、`Switch`、`Slider`、`TagsInput`、`NumberInput`、`Table*`、`Card*`、`Badge`、`Avatar*`、`Accordion*`、`Tabs*`、`Timeline*`、`Descriptions*`、`Skeleton*`、`Spinner*`、`Separator`、`Label`、`Progress`、`Kbd`、`Breadcrumb*`
- **Lib**：`color.ts`（颜色转换数学正确）、`date.ts`（日期解析有溢出校验）、`env.ts`（SSR 守卫完善）

---

## 八、方法论说明

- **扫描方式**：6 个并行 agent 分别覆盖表单/输入、浮层/弹出、数据展示、交互/特殊组件、composables、lib 工具函数，人工阅读源码分析
- **未覆盖**：`.test.ts` 测试文件、`styles.css`/`.css` 文件、`package.json` 配置、构建脚本
- **误报控制**：每项发现均附有代码证据和修复建议；不确定的标记为 "Suspicious"
- **与既有报告的关系**：本报告聚焦运行时 bug，不重复 `TECH_DEBT_REPORT.md`（技术债/类型安全）和 `compatibility-legacy-review-2026-07-07.md`（兼容性）已覆盖的内容
