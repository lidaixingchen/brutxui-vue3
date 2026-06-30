# BrutxUI 组件深化拓展方案（续篇）

## 概述

本文档是 [component-deepening-plan.md](./component-deepening-plan.md) 的续篇，覆盖第 9~16 批深化方向。在前 8 批覆盖无障碍合规、动效无障碍、变体实现、API 一致性、功能增强、程序化控制、Composable 抽取、系统性基建之后，本方案进一步从**展示组件语义、表单状态扩展、测试覆盖、导出同步、Locale 系统增强、验证集成、动效降级**七个维度挖掘深层拓展空间。

---

## 现状数据（补充）

| 指标 | 数值 | 说明 |
| --- | --- | --- |
| 组件目录总数 | 99 | 含页面模板和辅助组件 |
| Composable 总数 | 18 | 含 12 个有测试、6 个无测试 |
| 使用 defineExpose | 14 / 99 | 仅 14% 组件暴露方法 |
| hooks/index.ts 导出 | 3 / 18 | 仅导出 useToast/useTheme/useClipboard |
| Composable 测试覆盖 | 12 / 18 | 缺失：useClipboard/useLocale/useColorHistory/useReducedMotion/useAudioEngine/useCanvasInteraction |
| 支持语言 | 2 | zh-CN、en，fallback 硬编码为 zhCN |

---

## 第 9 批：展示组件无障碍语义补全（Critical）

> 以下组件完全缺失 ARIA 语义标注，屏幕阅读器用户无法理解内容结构。

### 9.1 Timeline — 添加 `role="list"` / `role="listitem"`

- **文件**：`packages/ui/src/components/timeline/Timeline.vue`、`TimelineItem.vue`
- **现状**：渲染为普通 `<div>`，无任何 ARIA 属性。屏幕阅读器无法识别时间线的列表结构
- **改动**：
  - `Timeline.vue`：根容器添加 `role="list"` 和 `aria-label`（使用 `useLocale` 的 `t('timeline.label')`）
  - `TimelineItem.vue`：每项添加 `role="listitem"`
  - `locales/types.ts`：新增 `timeline` namespace，包含 `label` key
  - `locales/zh-CN.ts`、`locales/en.ts`：补充翻译
- **测试**：验证 `role` 属性正确渲染、屏幕阅读器可识别列表结构

### 9.2 KanbanBoard — 拖拽键盘替代方案

- **文件**：`packages/ui/src/components/kanban/KanbanBoard.vue`
- **现状**：卡片可通过 Tab 聚焦 + Enter/Space 激活点击，但**拖拽操作完全依赖鼠标**，无法使用键盘完成
- **改动**：
  - 卡片 `@keydown` 新增处理：
    - `Space`：抓取/放下卡片（切换 `grabbedCard` 状态）
    - `ArrowUp/ArrowDown`：在当前列内移动卡片位置
    - `ArrowLeft/ArrowRight`：将卡片移动到相邻列
    - `Escape`：取消抓取
  - 抓取状态下添加 `aria-grabbed="true"` 和 `aria-dropeffect="move"`
  - 添加实时 `aria-live="polite"` 区域，播报卡片移动结果
  - 列头添加 `tabindex="0"` 和 `@keydown` 处理（ArrowLeft/Right 切换列焦点）
- **实现参考**：

  ```typescript
  const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null)

  function onCardKeydown(e: KeyboardEvent, cardId: string, columnId: string) {
    // Space 抓取/放下卡片
    if (e.key === ' ') {
      e.preventDefault()
      grabbedCard.value = grabbedCard.value ? null : { cardId, columnId }
      return
    }
    // Enter 触发 click 事件（已有逻辑）

    if (!grabbedCard.value) return

    if (e.key === 'Escape') {
      grabbedCard.value = null
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      moveCardInColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowUp' ? -1 : 1)
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      moveCardToAdjacentColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  ```

- **测试**：验证 Space 抓取/放下、方向键移动、Escape 取消、aria 属性更新

### 9.3 Card — 可点击时添加语义

- **文件**：`packages/ui/src/components/card/Card.vue`
- **现状**：渲染为普通 `<div>`，无 ARIA 属性。当 Card 作为可点击容器使用时缺乏语义
- **改动**：
  - 新增 `interactive?: boolean` prop（默认 `false`）
  - `interactive=true` 时添加 `role="button"`、`tabindex="0"`、键盘 Enter/Space 支持
  - emit `activate` 事件
  - 样式：`interactive` 时添加 `cursor-pointer` 和 hover 提升效果
- **测试**：验证 interactive 模式下的 ARIA 属性和键盘交互

---

## 第 10 批：表单组件状态扩展（High）

> 表单组件需要统一的 error/success 视觉状态和错误消息显示机制。当前仅 Input/Textarea 有 variant 级 error/success 样式，但缺少错误消息展示能力。

### 10.1 NumberInput — 添加 `variant` prop + error/success 变体

- **文件**：`packages/ui/src/components/number-input/number-input-variants.ts`、`NumberInput.vue`
- **现状**：`numberInputRootVariants` 仅有 `layout` 维度，无 error/success 变体。组件未暴露 `variant` prop
- **改动**：
  - `numberInputRootVariants` 新增 `variant` 维度：

    ```typescript
    variant: {
      default: '',
      error: 'border-brutal-danger focus-within:ring-brutal-danger',
      success: 'border-brutal-success focus-within:ring-brutal-success',
    }
    ```

  - `NumberInput.vue` 新增 `variant?: 'default' | 'error' | 'success'` prop
  - 传递给 `numberInputRootVariants`
- **测试**：验证各 variant 的边框颜色和 focus ring 颜色

### 10.2 SelectTrigger — 添加 `variant` prop + error/success 变体

- **文件**：`packages/ui/src/components/select/select-variants.ts`、`SelectTrigger.vue`
- **现状**：`selectTriggerVariants` 仅有 `size` 维度，无 error/success 变体
- **改动**：
  - `selectTriggerVariants` 新增 `variant` 维度（同 NumberInput 的 error/success 样式）
  - `SelectTrigger.vue` 新增 `variant?: 'default' | 'error' | 'success'` prop
- **测试**：验证各 variant 的视觉差异

### 10.3 Input/Textarea — 添加错误消息展示能力

- **文件**：`packages/ui/src/components/input/Input.vue`、`packages/ui/src/components/textarea/Textarea.vue`
- **现状**：仅有 `variant` 控制边框颜色，无错误消息文本展示区域
- **改动**：
  - 新增 `errorMessage?: string` prop
  - 当 `variant === 'error' && errorMessage` 时，在输入框下方渲染错误消息：

    ```html
    <p v-if="variant === 'error' && errorMessage" class="text-sm text-brutal-danger mt-1" role="alert">
      {{ errorMessage }}
    </p>
    ```

  - 错误消息使用 `role="alert"` 确保屏幕阅读器自动播报
- **测试**：验证错误消息渲染、role="alert" 属性、无消息时不渲染

### 10.4 NumberInput/Select — 添加错误消息展示能力

- **文件**：`packages/ui/src/components/number-input/NumberInput.vue`、`packages/ui/src/components/select/SelectTrigger.vue`
- **改动**：同 10.3 方案，新增 `errorMessage?: string` prop
- **测试**：验证错误消息渲染

---

## 第 11 批：程序化控制暴露 — 扩展（High）

> 原方案第 6 批覆盖了 5 个组件。以下为遗漏的高价值组件。

### 11.1 KanbanBoard — 暴露看板操作方法

- **文件**：`packages/ui/src/components/kanban/KanbanBoard.vue`
- **改动**：

  ```typescript
  defineExpose({
    moveCard,
    moveColumn,
    addCard,
    getColumn,
    getAllColumns: computed(() => props.modelValue),
  })
  ```

- **测试**：验证 ref 可调用暴露方法

### 11.2 TreeSelect — 暴露选择状态和搜索

- **文件**：`packages/ui/src/components/tree-select/TreeSelect.vue`
- **改动**：

  ```typescript
  defineExpose({
    open,
    searchQuery,
    selectedNodes,
    expandedIds,
    focus: () => triggerRef.value?.focus(),
  })
  ```

- **测试**：验证 ref 可控制面板状态

### 11.3 Stepper — 暴露步骤导航

- **文件**：`packages/ui/src/components/stepper/Stepper.vue`
- **改动**：

  ```typescript
  defineExpose({
    currentStep,
    totalSteps: computed(() => props.steps.length),
    goToStep,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
  })
  ```

- **测试**：验证 ref 可控制步骤导航

### 11.4 Input/Textarea — 暴露原生元素引用

- **文件**：`packages/ui/src/components/input/Input.vue`、`packages/ui/src/components/textarea/Textarea.vue`
- **改动**：

  ```typescript
  const inputRef = ref<HTMLInputElement | null>(null)
  defineExpose({
    ref: inputRef,
    focus: () => inputRef.value?.focus(),
    blur: () => inputRef.value?.blur(),
    select: () => inputRef.value?.select(),
  })
  ```

  模板中 `<input>` 添加 `ref="inputRef"`
- **测试**：验证 ref 可聚焦、失焦、选中文本

### 11.5 Slider — 暴露值状态

- **文件**：`packages/ui/src/components/slider/Slider.vue`
- **改动**：

  ```typescript
  defineExpose({
    currentValue: computed(() => props.modelValue),
    setValue: (value: number[]) => emit('update:modelValue', value),
  })
  ```

- **测试**：验证 ref 可读取和设置值

### 11.6 Combobox/ComboboxMulti — 暴露搜索和选择

- **文件**：`packages/ui/src/components/combobox/Combobox.vue`、`ComboboxMulti.vue`
- **改动**：

  ```typescript
  defineExpose({
    open,
    searchQuery,
    selectedValue,
    focus: () => triggerRef.value?.focus(),
  })
  ```

- **测试**：验证 ref 可控制面板和搜索

---

## 第 12 批：Composable 测试补全（High）

> 当前 18 个 composable 中有 6 个缺少测试文件，测试覆盖率仅 67%。

### 12.1 useClipboard 测试

- **文件**：`packages/ui/src/composables/useClipboard.test.ts`（新建）
- **测试内容**：
  - `copy()` 成功写入剪贴板
  - `copied` 在 1.5 秒后自动重置为 `false`
  - `isSupported` 在不支持 Clipboard API 的环境中返回 `false`
  - 复制失败时的错误处理

### 12.2 useLocale 测试

- **文件**：`packages/ui/src/composables/useLocale.test.ts`（新建）
- **测试内容**：
  - 无 provider 时回退到 `zhCN`
  - `t()` 正确查找嵌套 key
  - `t()` 支持 `{param}` 模板插值
  - 未定义的 key 回退到 `zhCN`，仍找不到时返回 path 原文
  - `provideLocale` 注入后 `useLocale` 正确消费

### 12.3 useColorHistory 测试

- **文件**：`packages/ui/src/composables/useColorHistory.test.ts`（新建）
- **测试内容**：
  - `addToHistory` 添加颜色到历史
  - 去重逻辑（相同颜色不重复添加）
  - 最大历史数量限制
  - `clearHistory` 清空历史
  - localStorage 持久化读写

### 12.4 useReducedMotion 测试

- **文件**：`packages/ui/src/composables/useReducedMotion.test.ts`（新建）
- **测试内容**：
  - 匹配 `prefers-reduced-motion: reduce` 时返回 `true`
  - 匹配 `no-preference` 时返回 `false`
  - 媒体查询变化时响应式更新

### 12.5 useAudioEngine 测试

- **文件**：`packages/ui/src/composables/useAudioEngine.test.ts`（新建）
- **测试内容**：
  - `play()` 成功播放音效
  - 不同音效类型（type/success/fail）播放正确频率
  - Web Audio API 不可用时的降级处理

### 12.6 useCanvasInteraction 测试

- **文件**：`packages/ui/src/composables/useCanvasInteraction.test.ts`（新建）
- **测试内容**：
  - 涂抹进度计算
  - 达到阈值后自动 reveal
  - Canvas 上下文不可用时的处理

---

## 第 13 批：hooks 导出同步 + 新 Composable 抽取（Medium）

> `hooks/index.ts` 仅重导出 3 个 composable，远落后于主入口的 17 个导出。同时有多个组件的内联逻辑值得抽取。

### 13.1 hooks/index.ts — 同步所有 composable 导出

- **文件**：`packages/ui/src/hooks/index.ts`
- **现状**：仅导出 `useToast`、`useTheme`、`useClipboard` 三个
- **改动**：同步导出所有公开 composable：

  ```typescript
  // 基础服务
  export { useToast, provideToast, createToast } from '../composables/useToast'
  export { useTheme, provideTheme, createTheme } from '../composables/useTheme'
  export type { ThemeName, ColorMode } from '../composables/useTheme'
  export { useLocale, provideLocale } from '../composables/useLocale'
  export { useClipboard } from '../composables/useClipboard'
  export { useReducedMotion } from '../composables/useReducedMotion'
  export { useAnimation } from '../composables/useAnimation'

  // 表单控件
  export { useDatePicker } from '../composables/useDatePicker'
  export { useColorPicker } from '../composables/useColorPicker'
  export { useColorHistory } from '../composables/useColorHistory'
  export { useFormFieldValidation } from '../composables/useFormFieldValidation'

  // 数据表格
  export { useDataTableSort } from '../composables/useDataTableSort'
  export { useDataTableFilter } from '../composables/useDataTableFilter'
  export { useDataTableSelection } from '../composables/useDataTableSelection'
  export { useDataTablePagination } from '../composables/useDataTablePagination'

  // 轮播
  export { useCarousel } from '../composables/useCarousel'

  // 多媒体
  export { useAudioEngine } from '../composables/useAudioEngine'
  export { useCanvasInteraction } from '../composables/useCanvasInteraction'
  ```

- **测试**：验证从 `hooks` 入口导入的所有 composable 均可用

### 13.2 useKanban — 看板拖拽逻辑抽取

- **文件**：`packages/ui/src/composables/useKanban.ts`（新建）
- **来源**：`KanbanBoard.vue` 中的拖拽状态管理、鼠标/键盘拖拽逻辑
- **抽取内容**：

  ```typescript
  export function useKanban(options: {
    columns: Ref<KanbanColumn[]>
    onCardMove?: (cardId: string, fromColumn: string, toColumn: string, index: number) => void
    onColumnMove?: (columnId: string, fromIndex: number, toIndex: number) => void
  }) {
    // 拖拽状态
    const draggingCard = ref<{ cardId: string; fromColumn: string } | null>(null)
    const draggingColumn = ref<string | null>(null)
    const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null)

    // 鼠标拖拽处理器
    function onDragStart(cardId: string, fromColumn: string) { ... }
    function onDragEnd() { ... }
    function onDragOver(e: DragEvent, columnId: string) { ... }
    function onDrop(e: DragEvent, toColumnId: string) { ... }

    // 键盘拖拽处理器
    function onCardKeydown(e: KeyboardEvent, cardId: string, columnId: string) { ... }
    function moveCardInColumn(cardId: string, columnId: string, direction: number) { ... }
    function moveCardToAdjacentColumn(cardId: string, columnId: string, direction: number) { ... }

    return {
      draggingCard, draggingColumn, grabbedCard,
      onDragStart, onDragEnd, onDragOver, onDrop,
      onCardKeydown, moveCardInColumn, moveCardToAdjacentColumn,
    }
  }
  ```

- **收益**：KanbanBoard.vue 简化为纯模板；composable 可独立测试；用户可在自定义布局中复用拖拽逻辑

### 13.3 useStepper — 步骤条逻辑抽取

- **文件**：`packages/ui/src/composables/useStepper.ts`（新建）
- **来源**：`Stepper.vue` 中的步骤导航、键盘处理、状态管理
- **抽取内容**：

  ```typescript
  export function useStepper(options: {
    steps: Ref<Step[]>
    initialStep?: number
    linear?: boolean
  }) {
    const currentStep = ref(options.initialStep ?? 0)
    const totalSteps = computed(() => options.steps.value.length)
    const isFirstStep = computed(() => currentStep.value === 0)
    const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)

    function goToStep(index: number) { ... }
    function nextStep() { ... }
    function previousStep() { ... }
    function handleKeydown(e: KeyboardEvent) { ... }

    return { currentStep, totalSteps, isFirstStep, isLastStep, goToStep, nextStep, previousStep, handleKeydown }
  }
  ```

- **收益**：可测试性、可复用性

---

## 第 14 批：Locale 系统增强（Medium）

> 国际化系统 fallback 逻辑硬编码为中文，缺少灵活性。

### 14.1 useLocale fallback 可配置化

- **文件**：`packages/ui/src/composables/useLocale.ts`
- **现状**：当用户 locale 中找不到 key 时，硬编码回退到 `zhCN`
- **改动**：
  - `provideLocale` 新增可选 `fallbackLocale?: Partial<Locale>` 参数
  - 默认值仍为 `zhCN`（保持向后兼容行为）
  - 回退链：用户 locale → fallbackLocale → zhCN → 返回 path 原文
  - 类型定义：

    ```typescript
    interface LocaleOptions {
      locale: Partial<Locale>
      fallbackLocale?: Partial<Locale>
    }
    ```

- **测试**：验证自定义 fallback 生效、默认回退到 zhCN

---

## 第 15 批：表单验证集成（Medium）

> 当前仅 HardcoreInput 实现了完整验证体系。Input/Textarea/NumberInput 等基础表单组件缺少验证集成。

### 15.1 Input — 可选集成 `useFormFieldValidation`

- **文件**：`packages/ui/src/components/input/Input.vue`
- **现状**：仅通过 `variant` prop 手动控制 error/success 样式，无自动验证
- **改动**：
  - 新增可选 props：`rules?: Array<(val: string) => boolean | string>`、`validateOn?: 'input' | 'blur' | 'submit'`
  - 当 `rules` 提供时，自动调用 `useFormFieldValidation`
  - 验证结果自动映射到 `variant`（error/success）和 `errorMessage`
  - 通过 `inject(formFieldKey)` 集成到 Form 上下文
  - 使用 `defineExpose` 暴露 `validate`、`reset` 方法
- **向后兼容**：`rules` 为可选 prop，不提供时行为与当前完全一致
- **测试**：验证 rules 驱动的自动验证、variant 自动切换、errorMessage 渲染

### 15.2 Textarea — 同 Input 方案

- **文件**：`packages/ui/src/components/textarea/Textarea.vue`
- **改动**：同 15.1

### 15.3 NumberInput — 添加 `variant` + 可选验证

- **文件**：`packages/ui/src/components/number-input/NumberInput.vue`
- **改动**：
  - 结合 10.1 的 variant 扩展
  - 新增可选 `rules` prop，验证逻辑同 Input
  - `defineExpose` 暴露 `validate`、`reset`

---

## 第 16 批：动效无障碍扩展（Medium）

> 原方案第 2 批覆盖了 4 个持续动画组件。以下组件也包含动画但未尊重 `prefers-reduced-motion`。

### 16.1 TypewriterText — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/typewriter-text/TypewriterText.vue`
- **现状**：逐字打字动画持续运行，对前庭功能障碍用户可能引发不适
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：跳过打字动画，直接显示完整文本
  - 保留光标闪烁（可通过 CSS `prefers-reduced-motion` 媒体查询自动暂停）
- **测试**：验证 reduced motion 下文本立即显示

### 16.2 GlitchButton — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/glitch-button/GlitchButton.vue`
- **现状**：已有 `useReducedMotion` 导入但需验证降级行为完整性
- **改动**：审查并确保 `prefersReduced=true` 时所有 glitch 效果完全禁用（包括 CSS `clip-path` 动画和伪元素位移）
- **测试**：验证 reduced motion 下无任何视觉抖动

### 16.3 GlitchText — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/glitch-text/GlitchText.vue`
- **现状**：同 GlitchButton，已有导入但需验证降级完整性
- **改动**：同 16.2
- **测试**：同 16.2

### 16.4 Counter — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/counter/Counter.vue`
- **现状**：数字递增/递减有过渡动画
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：跳过数字过渡动画，直接显示目标值
- **测试**：验证 reduced motion 下数字无过渡

---

## 约定与决策

继承自 [component-deepening-plan.md](./component-deepening-plan.md) 的约定，补充以下条款：

- **测试覆盖**：所有新增 composable 必须配套 `.test.ts` 文件；hooks/index.ts 导出必须与主入口同步
- **Locale fallback**：fallback 链路可配置但默认回退到 `zhCN`

---

## 更新日志

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 2026-06-30 | v1.0 | 初始版本，规划第 9~16 批深化拓展方向 |
| 2026-06-30 | v1.1 | 实施第 9~16 批深化拓展方案 |
