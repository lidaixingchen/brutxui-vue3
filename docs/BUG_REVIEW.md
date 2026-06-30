# BrutxUI 代码审查报告

> **审查日期**: 2026-06-30
>
> **修复日期**: 2026-06-30
>
> **修复原则**: 修复问题不需要注意兼容性，抛弃历史包袱。

---

## 🔴 High — `parseFormattedDate` 解析相邻 token 时跳过字符 ✅

**文件**: `packages/ui/src/lib/date.ts:62-72`

```ts
while (i < format.length) {
    for (const token of ['YYYY', 'YY', 'MM', 'DD', 'HH', 'mm', 'ss']) {
        if (format.startsWith(token, i)) {
            formatTokens.push(token)
            i += token.length
            break
        }
    }
    i += 1  // ← 即使 token 匹配成功也会执行
}
```

**故障场景**: 格式 `YYYYMMDD`（无分隔符，常见格式）：

- i=0: `YYYY` 匹配，i 变为 4，然后 `i += 1` 使 i=5（**跳过了第一个 `M`**）
- i=5: 只剩一个 `M`，`MM` 不匹配 → `MM` token 丢失
- 结果: `formatTokens = ['YYYY', 'DD']`，月份值被错误赋给 `DD`

**具体错误**: 输入 `20240615`、格式 `YYYYMMDD`，返回 **2024年1月6日** 而非正确的 **2024年6月15日**。

**修复**:

```ts
while (i < format.length) {
    let matched = false
    for (const token of ['YYYY', 'YY', 'MM', 'DD', 'HH', 'mm', 'ss']) {
        if (format.startsWith(token, i)) {
            formatTokens.push(token)
            i += token.length
            matched = true
            break
        }
    }
    if (!matched) i += 1
}
```

---

## 🟠 Medium

### `useToast` fallback 单例的 `onScopeDispose` 绑定到错误的作用域 ✅

**文件**: `packages/ui/src/composables/useToast.ts:91-94` + `165-190`

**问题**: `createToast()` 在第 91 行注册 `onScopeDispose(() => clearToasts())`。当 `useToast()` 创建 fallback 单例时，`createToast()` 运行在 **第一个调用者组件** 的 setup 作用域中。当该组件卸载时：

- `clearToasts()` 触发，**清空所有 toast**（包括其他组件的 toast）
- 定时器被清除，其他组件的自动关闭 toast 永不关闭

**现状**: `destroyFallback()` 函数已存在（第 167-172 行），但需要手动调用，不会在组件卸载时自动触发。

**修复**: 不要在 fallback 单例中注册 `onScopeDispose`，或重构为检测是否为 fallback 使用场景。

---

### `useCarousel` 初始挂载时未应用 reduced-motion 偏好 ✅

**文件**: `packages/ui/src/composables/useCarousel.ts:91-100`

```ts
watch(prefersReducedMotion, (reduced) => {
    if (!emblaApi.value) return  // ← immediate: true 时 emblaApi 总是 null
    // ...
}, { immediate: true })
```

**问题**: `{ immediate: true }` 使 watch 在 setup 阶段触发，此时 `emblaApi.value` 为 null → 函数提前返回。而 `onMounted`（第 69 行）没有重新检查 `prefersReducedMotion`。

**影响**: 使用 `prefers-reduced-motion: reduce` 的用户在初始加载时会看到动画，直到偏好发生变化。这是**可访问性问题**。

**修复**: 在 `onMounted` 中添加 reduced-motion 检查：

```ts
onMounted(() => {
    if (!emblaApi.value) return
    // ...existing listener registration...
    if (prefersReducedMotion.value) {
        emblaApi.value.reInit({ duration: 0 })
    }
    onInit()
    startAutoplay()
})
```

---

### `useCarouselEnhanced` 进度条与响应式 autoplay 变化不同步 ✅

**文件**: `packages/ui/src/composables/useCarouselEnhanced.ts` + `packages/ui/src/composables/useCarousel.ts:78-89`

**问题**: `useCarousel` 内部的 watch（第 78-89 行）调用的是 **基础版** `startAutoplay`/`stopAutoplay`，绕过了 `useCarouselEnhanced` 的增强版包装。当 `autoplay` 或 `autoplayDelay` 通过响应式变化时：

- 进度条不会启动/停止
- 进度条间隔不会同步更新

**修复**: 暴露 `emblaApi` 并让 `useCarouselEnhanced` 设置自己的 watcher，或重构 `useCarousel` 接受可选的 `onStart`/`onStop` 回调。

---

### `GlitchText` 缺少 `trigger` 属性监听器 ✅

**文件**: `packages/ui/src/components/glitch-text/GlitchText.vue`

**问题**: 组件在 `onMounted` 时根据 `trigger` 启动 autoplay，但 **没有 watch 监听 `trigger` 变化**。对比 `GlitchButton.vue:82-90` 正确实现了此 watch。

**故障场景**: `trigger` 从 `"autoplay"` 改为 `"hover"` → `setInterval` 持续运行，定时器泄漏。

**修复**: 添加 `watch` 监听 `trigger` 变化，参考 `GlitchButton.vue` 的实现。

---

### `DataTable` 的 `{ deep: true }` watch 导致不必要的状态重置 ✅

**文件**: `packages/ui/src/components/data-table/DataTable.vue:151-154`

```ts
watch(() => props.data, () => {
    selection.clearSelection()
    pagination.goToPage(1)
}, { deep: true })
```

**问题**: `deep: true` 使 watch 追踪所有嵌套属性变化。父组件原地修改 data 中某行字段时，触发 watch → 选中被清除、分页跳回第一页。

**修复**: 将 `{ deep: true }` 替换为对数组引用或长度的浅比较，或使用更精确的追踪方式。

---

## 🟡 Low

### `useTheme` fallback 单例的 `destroy()` 永不被调用 ✅

**文件**: `packages/ui/src/composables/useTheme.ts:160-171`

**问题**: 与 `useToast` fallback 相同的模式。`useTheme()` 创建的 fallback 单例调用了 `initTheme()`（注册 `matchMedia` 监听器），但 `destroy()` 永远不会被调用。`provideTheme()` 正确通过 `onUnmounted` 清理。

**修复**: 导出 `destroyFallback()` 函数（类似 `useToast.ts` 中的模式），或在适当时机通过 `onScopeDispose` 注册清理。

---

### `useCarousel` embla 事件监听器的防御性缺陷 ✅

**文件**: `packages/ui/src/composables/useCarousel.ts:69-76, 102-109`

**问题**: `onMounted` 和 `onUnmounted` 都检查 `emblaApi.value`。如果 `emblaApi.value` 在挂载和卸载之间变为 null（如 embla 被销毁），`off()` 调用被跳过，监听器泄漏。

**修复**: 在 `onMounted` 中将 `emblaApi.value` 捕获到局部变量，`onUnmounted` 中使用同一引用：

```ts
let api: EmblaCarouselType | null = null
onMounted(() => {
    api = emblaApi.value
    if (!api) return
    api.on('init', onInit)
    // ...
})
onUnmounted(() => {
    if (api) {
        api.off('init', onInit)
        // ...
    }
})
```

---

## ✅ 审查通过的关键领域

| 领域 | 结论 |
|---|---|
| `Toast.vue` 定时器管理 | ✅ 正确清理 |
| `DialogEnhanced.vue` 事件监听器 | ✅ 正确清理 document 监听器 |
| `Counter.vue` 资源管理 | ✅ 正确清理 rAF、ResizeObserver |
| `NoiseBackground.vue` 动画帧 | ✅ 正确清理 |
| `GlitchButton.vue` trigger 监听 | ✅ 正确实现 watch |
| `useReducedMotion` 监听器 | ✅ 正确清理 matchMedia 监听器 |
| `useAudioEngine` 资源 | ✅ 正确关闭 AudioContext |
| `useFormFieldValidation` | ✅ 逻辑正确 |
| `data-table-utils` 排序/过滤/选择 | ✅ 边界条件处理完善 |
| `KanbanBoard` 拖拽逻辑 | ✅ DOM 操作边界检查完善 |
| `TreeSelect` 键盘导航 | ✅ 实现正确 |
| `useColorHistory` localStorage | ✅ 使用安全的存储包装器 |

---

## 📊 汇总

| 严重度 | 数量 | 关键问题 |
|---|---|---|
| 🔴 High | 1 | `parseFormattedDate` token 解析跳过字符 |
| 🟠 Medium | 5 | toast fallback 泄漏、carousel reduced-motion、carousel 进度条不同步、GlitchText 定时器泄漏、DataTable deep watch |
| 🟡 Low | 2 | theme fallback 清理、carousel embla 监听器防御性 |

**最高优先级修复建议**: `parseFormattedDate` 的 bug 影响所有无分隔符日期格式的解析正确性，应立即修复。
