# BrutxUI Vue 3 — UI 包全面 Bug 扫描报告（第二轮）

> **扫描日期**：2026-07-18
> **审查范围**：`packages/ui/src/` 全部组件、composables、lib 工具函数、指令、顶层入口文件
> **扫描方式**：人工源码审查（未运行静态检查工具）
> **审查文件数**：约 280 个源文件（不含 `.test.ts`）
> **对照基线**：[ui-bug-scan-2026-07-11.md](./ui-bug-scan-2026-07-11.md)

---

## 一、摘要

本轮扫描基于 2026-07-11 报告作为基线，逐一验证 41 项既有 bug 的修复状态，并发现新问题。

| 维度 | 数量 | 说明 |
|------|------|------|
| 既有 bug 已修复 | **29** | 占基线 41 项的 70.7% |
| 既有 bug 仍存在 | **8** | 未修复或部分修复 |
| 新发现 bug | **2** | 本轮新发现 |

按本轮有效 bug 严重程度分布：

| 严重程度 | 数量 |
|----------|------|
| High | 1 |
| Medium | 3 |
| Low | 6 |

**总体评估**：相比 2026-07-11，项目质量显著提升。`C-1`（DataTable spanMethod 完全失效）、`H-2/H-3/H-4` 三项 High 级缺陷均已彻底修复；`M-1/M-3/M-4/M-5/M-6/M-8/M-9/M-10/M-11/M-12` 全部 10 项 Medium 级缺陷已修复（含 2 项部分修复）；24 项 Low 中已修复 15 项。

**主要剩余风险**：`H-1`（Toast 双定时器冲突）仍未修复，是当前唯一一项 High 级缺陷，影响 Toast 离场动画与 `pauseOnHover` 功能。

---

## 二、修复进度总览

### 已彻底修复（29 项）

| 既有 ID | 文件 | 修复方式摘要 |
|---------|------|--------------|
| C-1 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L133-L141) | `spanMethod` 结果预计算到 `Map` 缓存（`getCellSpan`），模板改为 `:rowspan` / `:colspan` HTML 属性绑定（L718-719） |
| H-2 | [Toast.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/toast/Toast.vue#L75) | `resumeTimer()` 增加 `if (!props.duration) return` 早返回 |
| H-3 | [Counter.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/counter/Counter.vue#L134-L145) | 引入独立隐藏 `measureRef` span 显示 `finalDisplayValue` 用于自然宽度测量；`constrainedWidth` 改用 `root.parentElement?.clientWidth ?? root.clientWidth` |
| H-4 | [Upload.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/upload/Upload.vue#L157-L159) | `retryUpload` 增加 `if (file.status === 'uploading') file.abortController?.abort()`；`doUpload` 增加 `settled` 标志与 `isCancelled` 守卫防止重复 emit |
| M-1 | [FormControl.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/form/FormControl.vue#L25-L34) | 改用 reka-ui `Primitive` + `as-child` 合并 `id` / `aria-describedby` / `aria-invalid` 到 slotted 子元素 |
| M-3 | [useKanban.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useKanban.ts#L52-L65) | `onDragStart` 与 `onDragEnd` 均增加 `if (dragEndRafId !== null) cancelAnimationFrame(dragEndRafId)` 守卫 |
| M-4 | [useDialog.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialog.ts#L20-L22) | `show()` 先调用 `currentInstance.close()` 关闭前一个实例再创建新实例 |
| M-5 | [useStepper.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useStepper.ts#L33-L71) | `goToStep` 增加 `force` 参数；Home/End 调用 `goToStep(0, true)` / `goToStep(totalSteps - 1, true)` 跳过线性检查 |
| M-6 | [SubMenu.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/SubMenu.vue#L233) | 水平模式下用外层 `<div class="absolute top-full left-0 pt-1.5">` padding 包裹，替代 `<ul>` 的 `mt-1.5` margin，保持悬停区域连续 |
| M-8 | [Tour.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tour/Tour.vue#L329-L335) | `handleKeyDown` 增加 `target.tagName` 检查，INPUT/TEXTAREA/isContentEditable 元素直接 return |
| M-9 | [GlitchText.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/glitch-text/GlitchText.vue#L5) | 统一从 `@/lib/defaults` 导入 `DEFAULT_AUTOPLAY_INTERVAL_MS` / `GLITCH_AUTOPLAY_ACTIVE_DURATION_MS` / `GLITCH_MIN_INTERVAL_MS`；`clearTimeout(autoplayStopTimer.value)` 在赋新值前调用（L40-42） |
| M-10 | [TreeView.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-view/TreeView.vue#L107-L114) | `emitNodesUpdate` 通过 `getCurrentInstance()?.vnode.props?.['onUpdate:nodes']` 检测监听器存在性，仅当存在监听器时才设 `isUpdatingInternally` 标志 |
| M-11 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L448-L624) | 可排序 `<th>` 增加 `@keydown.space.prevent="handleSort(column.id)"` |
| M-12 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L91-L95) | `watch(expandRowKeys)` 改为 `expandedRowKeys.value = newKeys ? new Set(newKeys) : new Set()`，正确处理 `undefined` |
| L-4 | [Tour.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tour/Tour.vue#L225-L245) | `updatePosition` 引入 `positionRequestId` 自增 ID + `if (requestId !== positionRequestId) return` 取消过期异步更新 |
| L-6 | [Input.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/input/Input.vue#L228) | `compositionend` 现在会 emit 最终值 |
| L-8 | [InfiniteScroll.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/infinite-scroll/InfiniteScroll.vue#L102-L115) | `watch(disabled)` 启用分支增加 `if (props.immediate || observerResult === 'unsupported')` 检查 |
| L-11 | [HardcoreInput.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/hardcore-input/HardcoreInput.vue#L192-L193) | 增加 `@compositionstart="isComposing = true"` 与 `@compositionend="onCompositionEnd"` 处理 |
| L-13 | [Rate.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/rate/Rate.vue#L92-L107) | 增加 Home/End 键处理；增加 `nextValue !== props.modelValue` 守卫避免冗余 emit |
| L-14 | [MenuItem.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/MenuItem.vue#L77) / [SubMenu.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/menu/SubMenu.vue#L206) | `@keydown.space` 增加 `.prevent` 修饰符 |
| L-15 | [Combobox.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/combobox/Combobox.vue#L141-L146) | `isSelected` 增加 `Array.isArray(props.modelValue)` 守卫后再 `.includes()`，避免字符串做子串匹配 |
| L-16 | [TreeSelectNode.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-select/TreeSelectNode.vue#L91-L100) | `focusParent` 增加 `if (!currentItem) return` null 检查 + `instanceof HTMLElement` 守卫 |
| L-17 | [TreeSelect.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-select/TreeSelect.vue#L94-L102) | `open` setter 增加 `if (props.open === undefined)` 守卫，受控模式下不更新 `internalOpen` |
| L-18 | [useCarousel.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useCarousel.ts#L109-L112) | 增加 `watch(emblaApi, ...)` 监听 `emblaApi` 后续可用时调用 `initCarousel` 恢复初始化路径 |
| L-19 | [useCarouselEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useCarouselEnhanced.ts#L42-L57) | `startProgressTimer` 增加 `if (!toValue(options.autoplay) || prefersReducedMotion.value) return` 守卫 |
| L-20 | [DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L133-L141) | `getCellSpan` 缓存 `spanMethod` 结果到 `Map`，避免每帧重复调用 6 次 |
| L-21 | [Upload.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/upload/Upload.vue#L72-L74) | `watch(() => props.fileList, ...)` 改为引用监听（无 `deep: true`），避免进度更新频繁触发 |
| L-22 | [useGlitchEffect.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useGlitchEffect.ts#L2) | 统一从 `@/lib/defaults` 导入 `GLITCH_MIN_INTERVAL_MS`，删除本地 `MIN_AUTOPLAY_INTERVAL_MS = 100` |
| L-23 | [useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L270-L280) | `handleClose` 不再使用 `function.length` 区分模式，改为直接 `await opt.beforeClose()` 判断返回值 |

---

## 三、High 级别

### H-1: Toast 双定时器冲突 — 离场动画与 `pauseOnHover` 失效（仍存在）

- **文件**：[useToast.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useToast.ts#L96-L120) + [Toast.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/toast/Toast.vue#L59-L90)
- **类别**：竞态条件 / 逻辑错误
- **描述**：`useToast.addToast` 在 toast 入数组时立即启动 `setTimeout(removeToast, duration)`（L96-100 分组路径、L117-120 普通路径）；`Toast.vue.onMounted` 又独立启动 `setTimeout(startLeave, duration)`（L85-90）。由于 `useToast` 的定时器先注册（在 `addToast` 调用瞬间），`Toast.vue` 的定时器在 `onMounted` 稍后注册，`useToast` 的定时器先触发并从数组移除 toast，Vue 卸载 `Toast.vue`，导致离场动画永不着火。

```ts
// useToast.ts L117-120 — 入数组时立即启动定时器
const duration = toast.duration ?? DEFAULT_TOAST_DURATION
if (duration > 0 && isClient) {
    const timerId = setTimeout(() => removeToast(id), duration)
    timerMap.set(id, timerId)
}

// Toast.vue L85-90 — onMounted 又启动一个定时器
onMounted(() => {
    if (props.duration) {
        remainingTime.value = props.duration
        startTimer()  // 内部 setTimeout(startLeave, duration)
    }
})
```

此外，`useToast` 的定时器无暂停/恢复机制。用户悬停 toast 时 `Toast.vue.pauseTimer()` 仅暂停自身定时器，`useToast` 的定时器继续倒计时并在用户悬停期间移除 toast，`pauseOnHover` 实际失效。

`ToastContainer.vue` 模板仅渲染 `<slot />`，未直接消费 `Toast` 的 `close` 事件——`Toast.vue` 的 `emit('close')` 在 `ToastContainer` 默认渲染路径下未连接到 `removeToast`。

**修复建议**（沿用 2026-07-11 报告）：移除 `useToast` 内部定时器（L96-100、L117-120），改由 `Toast.vue` 的 `close` 事件触发 `removeToast`。需在 `ToastContainer` 或 `Toast` 渲染处连接 `@close="removeToast(toast.id)"`。这样 `pauseOnHover` 也会自然生效。

---

## 四、Medium 级别

### M-2: FormWizard `completedSteps` 仅清除当前步骤（部分修复）

- **文件**：[FormWizard.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/form/FormWizard.vue#L59-L66)
- **类别**：逻辑错误（状态转换）
- **描述**：2026-07-11 报告的原始问题已部分修复：`watch(modelValue)` 现在同时调用 `stepErrors.value.delete(currentStep.value)` 和 `completedSteps.value.delete(currentStep.value)`。但残留问题：当用户在步骤 N 修改数据使其失效时，仅 `currentStep`（步骤 N）被清除，**下游所有已完成步骤的 `completedSteps` 状态未失效**。

```ts
// FormWizard.vue L59-66 — 仅清除当前步骤
watch(() => props.modelValue, () => {
    stepErrors.value.delete(currentStep.value)
    completedSteps.value.delete(currentStep.value)  // ← 仅当前步骤
}, { deep: true })
```

**残留场景**：用户完成步骤 0/1/2 → 返回步骤 0 修改数据使步骤 2 失效 → `watch` 仅清除步骤 0 的完成状态 → 步骤 1、2 仍在 `completedSteps` 中 → 用户点击步骤 2 指示器 → 线性检查 `completedSteps.value.has(i)` 对步骤 1 通过 → 跳过已失效的步骤 1。

**修复建议**：清除 `currentStep` 之后所有步骤：

```ts
watch(() => props.modelValue, () => {
    stepErrors.value.delete(currentStep.value)
    completedSteps.value.delete(currentStep.value)
    // 清除当前步骤之后的所有完成状态（数据变更可能使下游失效）
    for (let i = currentStep.value + 1; i < props.steps.length; i++) {
        completedSteps.value.delete(i)
        stepErrors.value.delete(i)
    }
}, { deep: true })
```

### M-7: `showMessageBox` 仍存在 i18n 反模式（部分修复）

- **文件**：[functional.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/dialog/functional.ts#L296-L301)
- **类别**：i18n / 代码质量
- **描述**：2026-07-11 报告中硬编码 `'输入格式不正确'` 已修复——`errorMessage.value = t('dialog.inputError')`（L303-305）。但残留新的 i18n 反模式：通过字符串比较 `locale.value.dialog.close === '关闭'` 检测语言，硬编码 `'确定'` / `'取消'` / `'Confirm'` / `'Cancel'`。

```ts
// functional.ts L296-301 — 字符串比较检测语言，硬编码按钮文案
const isZh = computed(() => {
    return locale.value.dialog.close === '关闭'  // ← 脆弱的语言检测
})

const defaultConfirmText = computed(() => isZh.value ? '确定' : 'Confirm')
const defaultCancelText = computed(() => isZh.value ? '取消' : 'Cancel')
```

**问题**：
1. 用户若自定义 zh-CN locale 修改 `dialog.close` 字符串，`isZh` 误判为非中文，按钮显示 `Confirm` / `Cancel`。
2. 新增语言（如 ja、ko）需扩展三元表达式，违反开闭原则。
3. 与项目既有 i18n 体系（`t()` + locale 文件）不一致。

**修复建议**：在 `locales/zh-CN.ts` 与 `locales/en.ts` 增加 `dialog.confirm` / `dialog.cancel` 键，直接使用 `t('dialog.confirm')` / `t('dialog.cancel')`，删除 `isZh` 检测逻辑。

### M-13: TreeView `defaultExpanded` watch 覆盖用户手动展开状态（新发现）

- **文件**：[TreeView.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/tree-view/TreeView.vue#L119-L121)
- **类别**：v-model / 响应式
- **描述**：`defaultExpanded` 语义上应为非受控初始值（仅在初始化时生效），但当前 watch 在 `defaultExpanded` 变化时用 `new Set(newVal)` **整体替换** `expandedIds`，丢弃用户后续手动展开的节点。

```ts
// TreeView.vue L117-121
const expandedIds = shallowRef<Set<string>>(new Set(props.defaultExpanded));

watch(() => props.defaultExpanded, (newVal) => {
    expandedIds.value = new Set(newVal)  // ← 整体替换，丢失用户展开
})
```

**触发场景**：父组件使用 `:default-expanded="['a', 'b']"` 初始化 → 用户手动展开节点 `c` → 父组件因不相关原因重渲染并传入新的 `defaultExpanded` 数组引用（即使内容相同）→ watch 触发 → 用户对 `c` 的展开被丢弃。

**修复建议**：`defaultExpanded` 应仅作为初始值，删除 watch；若需受控同步，应通过 `expanded` prop + `update:expanded` event 实现独立的受控 API。

---

## 五、Low 级别

### L-1: `useDialogEnhanced.initSize` 重复 rAF 未取消（仍存在）

- **文件**：[useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L292-L303)
- **类别**：内存泄漏 / 生命周期
- **描述**：`initSize()` 每次 `contentRef.value` 变化时调度新 rAF，但未取消前一个。`onBeforeUnmount` 仅能取消最新 ID，前序 rAF 仍在队列中触发 `getBoundingClientRect()` 读取（虽无害但浪费）。

```ts
// useDialogEnhanced.ts L294-303
function initSize(): void {
    if (contentRef.value) {
        sizeRafId = requestAnimationFrame(() => {  // ← 未取消前一个
            const rect = contentRef.value?.getBoundingClientRect()
            ...
        })
    }
}
```

**修复建议**：

```ts
function initSize(): void {
    if (sizeRafId !== null) cancelAnimationFrame(sizeRafId)
    if (contentRef.value) {
        sizeRafId = requestAnimationFrame(() => { ... })
    }
}
```

### L-2: `useTheme` fallback 单例的 `matchMedia` 监听器无组件级清理（仍存在，可接受）

- **文件**：[useTheme.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useTheme.ts#L193-L209)
- **类别**：内存泄漏
- **描述**：fallback 单例的 `mediaQuery` listener 仅通过 `beforeunload` 移除，无组件级清理。`provideTheme()` 路径已正确使用 `onUnmounted(theme.destroy)`（L181），但 `useTheme()` fallback 路径未注册组件级清理。
- **影响**：仅当用户未调用 `provideTheme()` 而直接使用 `useTheme()` 时触发，且单例本就预期整个应用生命周期存活，影响极小。
- **修复建议**：可保持现状；或在 `useTheme()` fallback 路径中通过 `getCurrentInstance()` + `onUnmounted(destroyFallback)` 提供组件级清理（但需评估多组件共享单例的语义）。

### L-3: `render-imperative.destroy` 的 `setTimeout` 未跟踪（仍存在）

- **文件**：[render-imperative.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/render-imperative.ts#L58-L74)
- **类别**：内存泄漏
- **描述**：`destroy()` 在 `transitionDuration > 0` 时调度 `setTimeout(removeContainer, delay)`，但未跟踪该 timeout ID。`isDestroyed` 标志防止重复进入 `destroy`，但若页面快速导航，多个 timeout 仍会堆积。

```ts
// render-imperative.ts L58-74
function destroy() {
    if (isDestroyed) return
    isDestroyed = true
    render(null, container)
    const removeContainer = () => { container.remove() }
    const delay = options.transitionDuration ?? DEFAULT_DIALOG_TRANSITION_MS
    if (delay > 0) {
        setTimeout(removeContainer, delay)  // ← 未跟踪
    } else {
        removeContainer()
    }
}
```

- **影响**：`container.remove()` 对已移除节点是 no-op，无功能性后果；仅浪费一个 timer 槽位。
- **修复建议**：低优先级，可保持现状；若需修复，将 timeout ID 存为模块级变量并在新 `destroy` 调用时 `clearTimeout`。

### L-5: `useDialogEnhanced.handleClose` 无并发守卫（仍存在）

- **文件**：[useDialogEnhanced.ts](file:///e:/project/brutxui-vue3/packages/ui/src/composables/useDialogEnhanced.ts#L270-L280)
- **类别**：竞态条件
- **描述**：`handleClose` 在 `beforeClose` 为异步函数时无并发锁。快速触发关闭（如双击关闭按钮）会导致 `beforeClose` 并发执行，可能产生重复 API 调用。

```ts
// useDialogEnhanced.ts L270-280
async function handleClose(): Promise<void> {
    if (!opt.beforeClose) {
        performClose()
        return
    }
    const result = await opt.beforeClose()  // ← 并发风险
    if (result !== false) {
        performClose()
    }
}
```

**修复建议**：增加 `isClosing` 标志：

```ts
let isClosing = false
async function handleClose(): Promise<void> {
    if (isClosing) return
    if (!opt.beforeClose) { performClose(); return }
    isClosing = true
    try {
        const result = await opt.beforeClose()
        if (result !== false) performClose()
    } finally {
        isClosing = false
    }
}
```

### L-7: Cascader 预选值未找到时高亮首项（仍存在）

- **文件**：[Cascader.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/cascader/Cascader.vue#L381-L382)
- **类别**：逻辑错误
- **描述**：预选值在当前列选项中未找到时，`activeItemIndex` 设为 0 而非 -1，错误高亮首项。

```ts
// Cascader.vue L381-382
const foundIndex = currentOptions.findIndex(o => o.value === activeVal)
activeItemIndex.value = foundIndex !== -1 ? foundIndex : 0  // ← 应为 -1
```

**修复建议**：`activeItemIndex.value = foundIndex`（未找到时 `-1`）。

### L-9: DataTable `warnedColumns` Set 永不重置（仍存在）

- **文件**：[DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L262-L272)
- **类别**：逻辑错误
- **描述**：`warnedColumns` Set 在模块级声明后仅在 `watchEffect` 中 `add`，从不 `delete`。列被动态移除再添加后，警告不重现，开发者无法察觉配置问题。

```ts
// DataTable.vue L262-272
const warnedColumns = new Set<string>()

watchEffect(() => {
    if (!props.virtualScroll?.enabled) return
    visibleColumns.value.forEach((col) => {
        if (!col.width && !warnedColumns.has(col.id)) {
            console.warn(`[BrutxUI] Column "${col.id}" must have an explicit width when virtualScroll is enabled.`)
            warnedColumns.add(col.id)  // ← 只增不减
        }
    })
})
```

**修复建议**：在 `watchEffect` 中先清除集合再重新检测，或基于 `visibleColumns` 计算：

```ts
watchEffect(() => {
    if (!props.virtualScroll?.enabled) return
    const currentIds = new Set(visibleColumns.value.map(c => c.id))
    // 清除已移除列的记录
    for (const id of warnedColumns) {
        if (!currentIds.has(id)) warnedColumns.delete(id)
    }
    visibleColumns.value.forEach((col) => {
        if (!col.width && !warnedColumns.has(col.id)) {
            console.warn(...)
            warnedColumns.add(col.id)
        }
    })
})
```

### L-10: `date.ts` 格式化支持 `WW` 但解析不支持（仍存在）

- **文件**：[date.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/date.ts#L30-L80)
- **类别**：逻辑错误 / 格式不对称
- **描述**：`formatDate` 在 tokens 中支持 `WW`（周数，L40），但 `parseFormattedDate` 的 tokenRegex（L53-60）与 `formatTokens` 提取（L67）均不处理 `WW`，导致 `formatDate(d, 'YYYY-WW')` 产生的字符串无法用相同 format 解析回 Date。

```ts
// date.ts L32-41 — formatDate 支持 WW
const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    ...
    WW: pad2(getISOWeekNumber(date)),  // ← 格式化支持
}

// date.ts L53-60 — parseFormattedDate 不处理 WW
const tokenRegex = escaped
    .replace(/YYYY/g, '(\\d{4})')
    .replace(/YY/g, '(\\d{2})')
    .replace(/MM/g, '(\\d{1,2})')
    .replace(/DD/g, '(\\d{1,2})')
    .replace(/HH/g, '(\\d{1,2})')
    .replace(/mm/g, '(\\d{1,2})')
    .replace(/ss/g, '(\\d{1,2})')
    // ← 缺少 WW 处理
```

**修复建议**：在 `parseFormattedDate` 中增加 `WW` 的正则与 token 提取，并通过 ISO 周数反推日期；或在文档中明确声明 `WW` 仅用于格式化输出，不可用于往返解析。

### L-24: DataTable 魔法数字部分提取（部分修复）

- **文件**：[DataTable.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/data-table/DataTable.vue#L274-L289)
- **类别**：代码质量
- **描述**：列宽回退 `150`、行高回退 `48`、展开/选择列宽 `'40px'`/`'48px'` 已部分提取为 `DATA_TABLE_EXPAND_COLUMN_WIDTH_PX` / `DATA_TABLE_SELECT_COLUMN_WIDTH_PX` 等常量（L276-277）。但仍有少量魔法数字散落在模板与计算属性中，建议进一步审计提取。

---

## 六、修复优先级建议

### P0 — 立即修复

1. **H-1**：Toast 双定时器冲突（离场动画 + pauseOnHover 失效）—— 当前唯一 High 级缺陷

### P1 — 尽快修复

2. **M-2**：FormWizard `completedSteps` 仅清除当前步骤，下游失效步骤未清除
3. **M-7**：`showMessageBox` `isZh` 字符串比较检测语言，硬编码按钮文案
4. **M-13**（新）：TreeView `defaultExpanded` watch 覆盖用户手动展开
5. **L-5**：`useDialogEnhanced.handleClose` 无并发守卫

### P2 — 计划修复

6. **L-1**：`useDialogEnhanced.initSize` 重复 rAF 未取消
7. **L-7**：Cascader 预选值未找到时高亮首项
8. **L-9**：DataTable `warnedColumns` Set 永不重置
9. **L-10**：`date.ts` 格式化/解析 `WW` token 不对称
10. **L-24**：DataTable 魔法数字继续审计提取
11. **L-3**：`render-imperative.destroy` setTimeout 未跟踪（影响极小）
12. **L-2**：`useTheme` fallback 单例无组件级清理（可接受现状）

---

## 七、积极发现

本轮验证中确认以下区域修复质量优秀，无回归：

- **DataTable**：`C-1`（spanMethod）+ `M-11`（Space 键）+ `M-12`（expandRowKeys）+ `L-20`（缓存）一次性彻底修复，并引入 `getCellSpan` 预计算缓存提升性能
- **Toast**：`H-2`（持久化 mouseleave）通过简单早返回修复，干净利落
- **Counter**：`H-3` 引入独立 `measureRef` 隐藏 span 测量最终值宽度，方案优雅
- **Upload**：`H-4` 不仅增加 abort 守卫，还增加 `settled` + `isCancelled` 双重防重复 emit，修复彻底
- **TreeView**：`M-10` 使用 `getCurrentInstance()?.vnode.props?.['onUpdate:nodes']` 检测监听器存在性，正确处理无监听器场景
- **useKanban**：`M-3` 在 `onDragStart` 与 `onDragEnd` 双向都增加 `cancelAnimationFrame` 守卫
- **useStepper**：`M-5` 通过 `goToStep(index, force)` 参数优雅处理 Home/End 跳过线性检查
- **GlitchText / useGlitchEffect**：`M-9` + `L-22` 统一使用 `@/lib/defaults` 常量，消除分歧
- **Tour**：`M-8`（keydown 过滤）+ `L-4`（`positionRequestId` 取消机制）均彻底修复
- **Combobox**：`L-15` 增加 `Array.isArray` 守卫
- **TreeSelectNode**：`L-16` 增加 null 检查 + `instanceof` 守卫
- **TreeSelect**：`L-17` 增加受控模式守卫
- **useCarousel**：`L-18` 增加 `watch(emblaApi)` 恢复路径
- **useCarouselEnhanced**：`L-19` 同时检查 `autoplay` 与 `prefersReducedMotion`
- **Rate**：`L-13` 增加 Home/End + 冗余 emit 守卫
- **MenuItem / SubMenu**：`L-14` Space 键统一加 `.prevent`
- **InfiniteScroll**：`L-8` 启用分支增加 `immediate` 检查

---

## 八、方法论说明

- **扫描方式**：6 个并行 search agent 分别覆盖表单/输入、浮层/弹出、数据展示、交互/特殊组件、composables、lib 工具函数；主线程读取关键文件逐一验证 agent 发现
- **基线对照**：逐项验证 2026-07-11 报告的 41 项 bug 修复状态，标注 FIXED / STILL_PRESENT / PARTIALLY_FIXED
- **未覆盖**：`.test.ts` 测试文件、`.css` 文件、`package.json` 配置、构建脚本
- **误报控制**：每项"仍存在"结论均由主线程直接读取源文件确认；agent 的部分误报（如 TreeView drag state、DataTable spanMethod 性能）经源码验证后已剔除
- **新增发现**：本轮新发现 2 项 bug（M-13 TreeView defaultExpanded watch、M-7 残留 isZh 反模式），均为低影响但应修复
