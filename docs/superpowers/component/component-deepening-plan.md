# BrutxUI 组件深化拓展方案

## 概述

在前两轮拓展（路线图 + 全面拓展方案）覆盖 31 个组件之后，本方案从**第一性原理**出发，系统性扫描剩余 65+ 组件目录，从无障碍合规、API 一致性、功能完备性、系统性基建四个维度挖掘深层拓展空间。

---

## 现状数据

| 指标 | 数值 | 说明 |
| --- | --- | --- |
| 组件目录总数 | 96 | 含页面模板和辅助组件 |
| 已规划组件 | 31 | 路线图 + 全面拓展方案 |
| 未覆盖核心 UI | 37 | 本方案重点分析对象 |
| 使用 defineExpose | 7 / 96 | 仅 7% 组件暴露方法 |
| 使用 useReducedMotion | 6 / 96 | 仅 6% 组件尊重动效偏好 |
| 空变体值 | 2 处 | Accordion content、DatePicker trigger |
| 缺失 ARIA props | 9 个交互组件 | Switch/Checkbox/Toggle 等 |

---

## 第 1 批：无障碍合规修复（Critical）

> 这些问题直接影响屏幕阅读器用户的使用体验，属于 WCAG 2.1 合规硬伤。

### 1.1 Switch — 添加 `ariaLabel` prop

- **文件**：`packages/ui/src/components/switch/Switch.vue`
- **现状**：无任何 ARIA 属性，屏幕阅读器无法识别开关用途
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 透传给 `SwitchRoot` 的 `aria-label` 属性
  - 使用 `useLocale` 提供默认值 `t('switch.toggle')`
- **测试**：验证 `aria-label` 属性正确渲染

### 1.2 Checkbox — 添加 `ariaLabel` + indeterminate 图标区分

- **文件**：`packages/ui/src/components/checkbox/Checkbox.vue`
- **现状**：无 ARIA 标签；`indeterminate` 状态使用与 `checked` 相同的 `Check` 图标
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 当 `checked === 'indeterminate'` 时使用 `Minus` 图标替代 `Check`
  - 使用 `useLocale` 提供默认值
- **测试**：验证 `aria-label`、indeterminate 状态图标切换

### 1.3 Toggle — 添加 `ariaLabel` + `loading` 状态

- **文件**：`packages/ui/src/components/toggle/Toggle.vue`
- **现状**：无 ARIA 标签，无 loading 状态
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 新增 `loading?: boolean` prop，loading 时显示 `Loader2` spinner 并自动禁用
  - reka-ui Toggle 原语已内置 `aria-pressed`，无需手动处理
- **测试**：验证 `aria-label`、loading spinner、disabled 联动

### 1.4 RadioGroup — 添加 `ariaLabel` prop

- **文件**：`packages/ui/src/components/radio-group/RadioGroup.vue`
- **现状**：无 ARIA 标签
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 透传给 reka-ui `RadioGroupRoot` 的 `aria-label`
- **测试**：验证 `aria-label` 属性

### 1.5 TagsInput — 添加 `ariaLabel` prop

- **文件**：`packages/ui/src/components/tags-input/TagsInput.vue`
- **现状**：无 ARIA 标签
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 透传给 reka-ui `TagsInputRoot` 的 `aria-label`
  - 使用 `useLocale` 提供默认值
- **测试**：验证 `aria-label` 属性

### 1.6 Table — 添加 `ariaLabel` prop

- **文件**：`packages/ui/src/components/table/Table.vue`
- **现状**：`<table>` 元素无 `aria-label`
- **改动**：
  - 新增 `ariaLabel?: string` prop
  - 透传给 `<table>` 的 `aria-label`
- **测试**：验证 `aria-label` 属性

---

## 第 2 批：动效无障碍（High）

> `useReducedMotion` composable 已存在，但仅 6 个组件使用。持续动画对前庭功能障碍用户可能引发眩晕、恶心等症状（WCAG 2.3.3）。

### 2.1 Marquee — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/marquee/Marquee.vue`
- **现状**：CSS `animation` 持续滚动，无动效降级
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：移除动画类，静态展示第一个 slot 内容，隐藏重复的 `aria-hidden` 副本
  - 或通过 CSS 变量 `--marquee-play-state: paused` 暂停动画
- **测试**：验证 reduced motion 下动画暂停、内容可读

### 2.2 Carousel — 尊重 `prefers-reduced-motion`

- **文件**：`packages/ui/src/components/carousel/Carousel.vue`
- **现状**：`embla-carousel-vue` 的滑动过渡和 autoplay 无降级
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：停止 autoplay、禁用 embla 的 `duration` 过渡（设为 0）
- **测试**：验证 reduced motion 下 autoplay 停止、滑动无动画

### 2.3 NoiseBackground — 静态降级

- **文件**：`packages/ui/src/components/noise-background/NoiseBackground.vue`
- **现状**：Canvas 动画持续运行
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：渲染单帧后停止 `requestAnimationFrame` 循环
- **测试**：验证 reduced motion 下仅渲染静态噪点

### 2.4 BeforeAfter — 即时响应

- **文件**：`packages/ui/src/components/before-after/BeforeAfter.vue`
- **现状**：滑块拖拽有 CSS transition
- **改动**：
  - 引入 `useReducedMotion`
  - `prefersReduced=true` 时：移除滑块的 `transition` 样式
- **测试**：验证 reduced motion 下滑块即时响应

---

## 第 3 批：未完成变体实现（High）

> 这些是 CVA 变体中存在空字符串值的地方，意味着 variant 切换时视觉上无任何变化，属于功能缺陷。

### 3.1 Accordion — 填充 content 变体

- **文件**：`packages/ui/src/components/accordion/accordion-variants.ts`
- **现状**：`accordionContentVariants` 的 4 个 variant（`default`/`flat`/`ghost`/`interactive`）全部为空字符串 `''`
- **改动**：
  - `default`：保持现状（`border-t-3 border-brutal` 已在基础类中）
  - `flat`：`bg-brutal-muted/30`（微妙背景区分层次）
  - `ghost`：`border-transparent`（无边框分隔线，与 item 的 ghost 风格一致）
  - `interactive`：`hover:bg-brutal-muted/20`（为未来交互预留）
- **测试**：验证各 variant 的 content 区域视觉差异

### 3.2 DatePicker trigger — 填充 default 变体

- **文件**：`packages/ui/src/components/date-picker/date-picker-variants.ts`
- **现状**：`datePickerTriggerVariants` 的 `default` 为空字符串，仅 `error`/`success` 有值
- **改动**：保持现状为合理设计（default 即无额外样式，与 Input 组件行为一致），仅在文档中说明
- **决策**：不改动，归档为"设计如此"

---

## 第 4 批：API 一致性修复（High）

> 组件库的 API 一致性直接影响开发者的认知负荷和学习曲线。

### 4.1 Input/Textarea — `inputSize`/`textareaSize` → `size` 兼容别名

- **文件**：`packages/ui/src/components/input/input-variants.ts`、`Input.vue`、`packages/ui/src/components/textarea/textarea-variants.ts`、`Textarea.vue`
- **现状**：Input 用 `inputSize`、Textarea 用 `textareaSize`，其余 90%+ 组件用 `size`
- **改动**（向后兼容方案）：
  - CVA 变体文件保留 `inputSize`/`textareaSize` 不改（避免破坏现有用户）
  - 组件 Props 新增 `size` 别名，内部映射到 CVA 的 `inputSize`/`textareaSize`
  - 同时支持 `size` 和 `inputSize`/`textareaSize`，优先使用具体名称（向后兼容）
  - 使用 `useLocale` 不涉及
- **示例**：
  ```typescript
  // Input.vue
  interface InputProps {
    size?: 'sm' | 'default' | 'lg'  // 新增别名
    inputSize?: 'sm' | 'default' | 'lg'  // 保留旧名
  }
  const resolvedSize = computed(() => props.inputSize ?? props.size ?? 'default')
  ```
- **测试**：验证 `size` 和 `inputSize` 均可正常工作

### 4.2 Input — 添加 `readonly` prop

- **文件**：`packages/ui/src/components/input/Input.vue`
- **现状**：仅有 `disabled`，缺少 `readonly`（HardcoreInput 已有此功能）
- **改动**：
  - 新增 `readonly?: boolean` prop
  - 透传给 `<input>` 的 `readonly` 属性
  - 样式：`readonly` 时添加 `cursor-default` 但不添加 `opacity-50`（与 disabled 区分）
- **测试**：验证 readonly 属性透传、样式、不可编辑但可聚焦

### 4.3 Textarea — 添加 `readonly` prop

- **文件**：`packages/ui/src/components/textarea/Textarea.vue`
- **改动**：同 Input 的 readonly 方案
- **测试**：验证 readonly 属性透传

---

## 第 5 批：组件功能增强（Medium）

> 这些是各组件缺失的常见功能特性，提升后可覆盖更多使用场景。

### 5.1 Badge — 添加 `closable` + `dot` + `pulse`

- **文件**：`packages/ui/src/components/badge/Badge.vue`、`badge-variants.ts`
- **现状**：纯展示组件，仅 variant + size
- **改动**：
  - 新增 `closable?: boolean`，渲染 `×` 按钮，点击 emit `close`
  - 新增 `dot?: boolean`，在 badge 前渲染小圆点指示器
  - 新增 `pulse?: boolean`，dot 启用脉冲动画（使用全局 `brutal-pulse` 动画类）
  - 新增 `icon` 插槽，在文字前渲染自定义图标
- **测试**：验证 closable 按钮和 close 事件、dot 渲染、pulse 动画、icon 插槽

### 5.2 Alert — 添加 `closable` + `action` 插槽

- **文件**：`packages/ui/src/components/alert/Alert.vue`、`alert-variants.ts`
- **现状**：7 个 variant 但无交互能力
- **改动**：
  - 新增 `closable?: boolean`，右上角渲染关闭按钮
  - 新增 `action` 插槽，用于渲染操作按钮（如"重试"、"查看详情"）
  - 关闭按钮使用 `Button` 组件（`variant="ghost" size="icon"`）
  - emit `close` 事件
- **测试**：验证 closable 关闭、action 插槽渲染

### 5.3 Dialog — 添加 `size` 变体

- **文件**：`packages/ui/src/components/dialog/dialog-variants.ts`、`Dialog.vue`
- **现状**：`dialogContentVariants` 无 `size` 维度，固定 `max-w-lg`
- **改动**：
  - 新增 `size` 变体：`sm`（`max-w-sm`）/ `default`（`max-w-lg`）/ `lg`（`max-w-2xl`）/ `xl`（`max-w-4xl`）/ `full`（`max-w-[calc(100vw-2rem)]`）
  - `Dialog.vue` 新增 `size` prop，传递给 `DialogContent`
- **测试**：验证各 size 对应的 max-width 类

### 5.4 Tabs — 添加 `orientation`

- **文件**：`packages/ui/src/components/tabs/TabsList.vue`、`tabs-variants.ts`
- **现状**：仅支持水平布局
- **改动**：
  - `TabsList.vue` 新增 `orientation?: 'horizontal' | 'vertical'` prop（默认 `horizontal`）
  - 将 `orientation` 透传给 reka-ui `TabsRoot`（原语原生支持，自动处理 `aria-orientation` 和键盘方向键）
  - `vertical` 时 `tabsListVariants` 新增 `orientation` 变体：`flex-col`
- **测试**：验证 vertical 布局、`aria-orientation` 属性、键盘导航方向

### 5.5 Toast — 添加 `pauseOnHover`

- **文件**：`packages/ui/src/components/toast/Toast.vue`
- **现状**：自动关闭计时器在 hover 时不暂停，用户可能来不及阅读内容
- **改动**：
  - 新增 `pauseOnHover?: boolean` prop（默认 `true`）
  - `@mouseenter` 时暂停 timer，`@mouseleave` 时恢复（从剩余时间继续倒计时）
  - 进度条动画同步暂停（CSS `animation-play-state: paused`）
- **实现细节**：
  ```typescript
  const remainingTime = ref(props.duration)
  let startTime = 0

  function pauseTimer() {
    if (timer.value) {
      window.clearTimeout(timer.value)
      remainingTime.value -= Date.now() - startTime
    }
  }

  function resumeTimer() {
    startTime = Date.now()
    timer.value = window.setTimeout(startLeave, remainingTime.value)
  }
  ```
- **测试**：验证 hover 时暂停、离开后从剩余时间继续、进度条同步

### 5.6 Pagination — 省略号可点击跳页

- **文件**：`packages/ui/src/components/pagination/Pagination.vue`
- **现状**：`...` 是不可交互的 `<span>`
- **改动**：
  - 将省略号 `<span>` 改为 `<button>`，点击后 emit `jump` 事件
  - 使用 `useLocale` 提供 `aria-label`：`t('pagination.jumpPages')`
  - 可选：点击后弹出小型输入框（Popover + Input）直接输入页码，回车跳转
- **简化方案**（推荐）：省略号变为按钮，emit `jump` 事件，由父组件决定行为
- **测试**：验证省略号可点击、jump 事件触发

---

## 第 6 批：程序化控制暴露（Medium）

> 当前仅 7% 的组件暴露了 `defineExpose` 方法，限制了父组件的程序化控制能力。

### 6.1 Carousel — 暴露滚动方法

- **文件**：`packages/ui/src/components/carousel/Carousel.vue`
- **现状**：`scrollPrev`、`scrollNext`、`scrollTo` 函数已实现但未暴露
- **改动**：
  ```typescript
  defineExpose({
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex: computed(() => selectedIndex.value),
    canScrollPrev,
    canScrollNext,
  })
  ```
- **测试**：验证 ref 可调用暴露方法

### 6.2 DataTable — 暴露排序/筛选/选择方法

- **文件**：`packages/ui/src/components/data-table/DataTable.vue`
- **现状**：有 4 个 composable 但未暴露给父组件
- **改动**：
  ```typescript
  defineExpose({
    sort: { toggleSort, sorting },
    filter: { setGlobalFilter, globalFilter },
    selection: { toggleAllRows, toggleRow, selectedRows, isAllSelected },
    pagination: { setPage, nextPage, previousPage, pageIndex, pageCount },
  })
  ```
- **测试**：验证 ref 可调用暴露方法

### 6.3 DatePicker — 暴露面板控制

- **文件**：`packages/ui/src/components/date-picker/DatePicker.vue`
- **改动**：`defineExpose({ open })` — 允许父组件程序化打开/关闭日期面板
- **测试**：验证 ref 可控制面板状态

### 6.4 ColorPicker — 暴露面板控制

- **文件**：`packages/ui/src/components/color-picker/ColorPicker.vue`
- **改动**：`defineExpose({ open })` — 同 DatePicker 方案
- **测试**：验证 ref 可控制面板状态

### 6.5 Command — 暴露搜索过滤

- **文件**：`packages/ui/src/components/command/Command.vue`
- **改动**：`defineExpose({ filterSearch })` — 允许外部程序化触发搜索
- **测试**：验证 ref 可调用 filterSearch

---

## 第 7 批：Composable 抽取（Medium）

> 将复杂组件中内联的逻辑抽取为独立 composable，提升可测试性和可复用性。

### 7.1 useCarousel — 轮播逻辑抽取

- **文件**：`packages/ui/src/composables/useCarousel.ts`（新建）
- **来源**：`Carousel.vue` 中的 embla 初始化、autoplay、状态管理逻辑
- **抽取内容**：
  ```typescript
  export function useCarousel(options: {
    loop?: boolean
    autoplay?: boolean
    autoplayDelay?: number
  }) {
    // embla 初始化
    // selectedIndex, scrollSnaps, canScrollPrev, canScrollNext
    // scrollPrev, scrollNext, scrollTo
    // startAutoplay, stopAutoplay
    // 生命周期管理
    return { emblaRef, selectedIndex, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo, startAutoplay, stopAutoplay }
  }
  ```
- **收益**：Carousel.vue 简化为纯模板；composable 可独立测试；用户可在自定义布局中复用轮播逻辑

### 7.2 useDatePicker — 日期选择逻辑抽取

- **文件**：`packages/ui/src/composables/useDatePicker.ts`（新建）
- **来源**：`DatePicker.vue` 中的日期状态、面板开关、选择逻辑
- **收益**：可测试性、可复用性

### 7.3 useColorPicker — 颜色选择逻辑抽取

- **文件**：`packages/ui/src/composables/useColorPicker.ts`（新建）
- **来源**：`ColorPicker.vue` 中的颜色转换、选择、历史记录逻辑
- **收益**：可测试性、可复用性

---

## 第 8 批：系统性基建（Low）

> 影响面广但优先级较低的系统性改进。

### 8.1 useAnimation — 动画系统统一

- **文件**：`packages/ui/src/composables/useAnimation.ts`（新建）
- **现状**：`styles.css` 定义了 13 个 `brutal-*` 动画类，但组件各自实现动画逻辑，仅 3 个组件使用 CSS `prefers-reduced-motion`
- **目标**：
  ```typescript
  export function useAnimation(animationClass: string) {
    const prefersReduced = useReducedMotion()
    const resolvedClass = computed(() => prefersReduced.value ? '' : animationClass)
    return { animationClass: resolvedClass, prefersReduced }
  }
  ```
- **收益**：统一动画降级策略，减少重复代码

### 8.2 useFormFieldValidation — 表单验证 Composable

- **文件**：`packages/ui/src/composables/useFormFieldValidation.ts`（新建）
- **现状**：HardcoreInput 内联了完整的验证逻辑（rules、validateOn、validationState、errorMessage、triggerValidate），其他表单组件无验证
- **目标**：抽取为通用 composable，Input/Textarea/NumberInput 均可使用
- **收益**：统一的表单验证体验

### 8.3 Theme Runtime Customization — 运行时主题定制

- **文件**：`packages/ui/src/composables/useTheme.ts`（扩展）
- **现状**：`useTheme` 仅支持 4 个预设主题切换，无法运行时修改单个 CSS 变量
- **改动**：新增 `setCustomVariable(name: string, value: string)` 方法
- **收益**：品牌定制无需创建新主题预设

### 8.4 Accessibility Test Expansion — 无障碍测试扩展

- **文件**：`packages/ui/src/accessibility.test.ts`（扩展）
- **现状**：仅测试 6 个组件
- **目标**：扩展到所有交互组件（Switch、Checkbox、RadioGroup、Toggle、TagsInput、DatePicker、ColorPicker、Select、Combobox 等）
- **收益**：防止无障碍回归

---

## 约定与决策

- **向后兼容**：所有改动必须保持现有 API 不变，新增 prop 均有合理默认值
- **变体命名**：遵循现有约定 `default`/`primary`/`secondary`/`accent`/`success`/`danger`/`muted`/`outline`
- **尺寸命名**：新增 `size` 的组件统一使用 `sm`/`default`/`lg`；旧名 `inputSize`/`textareaSize` 通过别名兼容
- **国际化**：新增用户可见文本使用 `useLocale` 的 `t()` 函数
- **无障碍**：所有交互组件必须有 `ariaLabel` prop；动画组件必须尊重 `prefers-reduced-motion`
- **CSS 动画**：优先使用 `styles.css` 中已有的 `brutal-*` 动画类，避免在 `<style scoped>` 中重复定义 `@keyframes`
- **导出**：新增的 composable 在 `packages/ui/src/index.ts` 中同步导出

## 验证步骤

每批完成后执行：

1. `pnpm lint` — 代码规范检查
2. `pnpm typecheck` — 类型检查
3. `pnpm test` — 全部测试通过（含新增测试）
4. `pnpm --filter brutx-registry-vue build && pnpm --filter brutx-registry-vue validate` — 注册表验证
5. 最终全部门禁：`pnpm release:check`

---

## 更新日志

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 2026-06-30 | v1.0 | 初始版本，规划 8 批深化拓展方向 |
