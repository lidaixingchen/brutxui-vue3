# BrutxUI Vue 3 组件全面拓展方案

## 概述

对现有的 24 个组件进行系统性拓展，按优先级分为 8 批，每批独立可验证，全部包含测试覆盖。

---

## 当前状态

v0.7.8组件库已有 100+ 组件，测试覆盖率完善（每个组件目录均有 `.test.ts`）。但部分组件存在以下不足：

- **缺少视觉变体**：Kbd、Counter 仅有 `size` 无 `variant`；CopyToClipboard 仅有 `state`（idle/copied）无 `variant`/`size`
- **缺少尺寸变体**：Label、Skeleton 缺少 `size`
- **缺少功能特性**：Progress 无 indeterminate 模式、Slider 无垂直方向/tooltip、Separator 无文字分隔线
- **缺少交互状态**：FeedbackForm 无 loading/success、Combobox 无 loading/creatable
- **缺少布局选项**：ToggleGroup 无 vertical、Timeline 无 alternate

---

## 分批计划

### 第 1 批：简单变体补齐（4 个组件）

改动小、风险低、直接对齐现有模式（Badge/Button）。

#### 1.1 Kbd — 添加 `variant`

- **文件**：`packages/ui/src/components/kbd/kbd-variants.ts`、`Kbd.vue`、`kbd.test.ts`
- **改动**：`kbdVariants` 新增 `variant` 变体 — `default`/`primary`/`secondary`/`accent`，仿 Badge 变体规则
- **测试**：验证各 variant 对应的 color classes 正确渲染

#### 1.2 CopyToClipboard — 添加 `variant` + `size`

- **文件**：`packages/ui/src/components/copy-to-clipboard/copy-to-clipboard-variants.ts`、`CopyToClipboard.vue`、`copy-to-clipboard.test.ts`
- **改动**：
  - `copyToClipboardVariants` 新增 `variant`（`default`/`primary`/`outline`）和 `size`（`sm`/`default`/`lg`）
  - 组件 `Props` 新增 `variant` 和 `size` 属性
- **测试**：验证 variant 和 size 类正确渲染，idle/copied 状态不受影响

#### 1.3 Counter — 添加 `variant`

- **文件**：`packages/ui/src/components/counter/counter-variants.ts`、`Counter.vue`、`counter.test.ts`
- **改动**：`counterVariants` 新增 `variant` — `default`/`primary`/`accent`/`success`/`danger`，仅影响文字颜色
- **测试**：验证各 variant 颜色类正确渲染

#### 1.4 Label — 添加 `size` + `required` 指示器

- **文件**：`packages/ui/src/components/label/label-variants.ts`、`Label.vue`、`label.test.ts`
- **改动**：
  - `labelVariants` 新增 `size` — `sm`/`default`/`lg`
  - 组件新增 `required` prop，为 `true` 时渲染 `*` 红色星号
- **测试**：验证 size 类、required 星号渲染

---

### 第 2 批：Separator + Skeleton 增强（2 个组件）

#### 2.1 Separator — 添加 `variant` + `size` + `label` 插槽

- **文件**：`packages/ui/src/components/separator/separator-variants.ts`、`Separator.vue`、`separator.test.ts`
- **改动**：
  - `separatorVariants` 新增 `variant`（`default`/`primary`/`muted`）和 `size`（`sm`/`default`/`lg`，控制粗细）
  - 组件新增 `label` 插槽，当 orientation=horizontal 且有内容时渲染居中文字分隔线
- **实现细节**：Separator.vue 内部需**条件渲染两套结构**（仅靠 `SeparatorPrimitive` 的 `<slot>` 无法实现 flex 文字布局）：
  - 无 label 内容：保持现状，使用 `SeparatorPrimitive`（`decorative` 渲染简单分隔线）
  - 有 label 内容：改用普通 `<div role="separator">`，内部为 flex 布局——`::before`/`::after` 伪元素画线，`<slot>` 居中。此时 `decorative` 设为 `false`，保留 `role="separator"` 与 `aria-orientation`
  - 通过 `useSlots()` 检测 `label` slot 是否有内容来切换结构
- **测试**：验证 variant/size 类、label 插槽渲染、decorative 属性切换

#### 2.2 Skeleton — 添加 `size` + `shape` + `width`

- **文件**：`packages/ui/src/components/skeleton/skeleton-variants.ts`、`Skeleton.vue`、`skeleton.test.ts`
- **改动**：
  - `skeletonVariants` 新增 `size`（`sm`/`default`/`lg`/`xl`，控制高度）和 `shape`（`rect`/`circle`）
  - 组件新增 `width` prop（支持百分比字符串 `'100%'`）
  - `circle` shape 时强制 `rounded-full` 且 `w` = `h`（由 size 决定）
- **注意**：`SkeletonText`、`SkeletonAvatar`、`SkeletonCard`、`SkeletonTable` 不做改动，它们已有自己的实现
- **测试**：验证 size 高度、shape 圆角、width 自定义宽度

---

### 第 3 批：布局组件增强（3 个组件）

#### 3.1 ToggleGroup — 添加 `orientation`

- **文件**：`packages/ui/src/components/toggle-group/ToggleGroup.vue`、`toggle-group.test.ts`
- **改动**：
  - 新增 `orientation` prop（`horizontal`/`vertical`），默认 `horizontal`
  - `vertical` 时容器添加 `flex-col` 类
  - **必须将 `orientation` 透传给 `ToggleGroupRoot`**（reka-ui 原语原生支持该 prop，会自动设置 `aria-orientation`），仅改 CSS 会丢失屏幕阅读器方向语义
  - 通过 `toggleGroupKey` provide 给子项（子项可能需根据方向调整内部布局）
- **测试**：验证 horizontal/vertical 对应的 flex 方向类、`aria-orientation` 属性、原语 orientation 透传

#### 3.2 ScrollArea — 添加 `variant` + `size`

- **文件**：`packages/ui/src/components/scroll-area/scroll-area-variants.ts`、`ScrollArea.vue`、`ScrollBar.vue`、`scroll-area.test.ts`
- **改动**：
  - `scrollAreaScrollbarVariants` 新增 `variant`（`default`/`primary`/`accent`，控制滚动条颜色）
  - `scrollAreaScrollbarVariants` 新增 `size`（`sm`/`default`/`lg`，控制滚动条粗细）
  - `ScrollArea.vue` 新增 `variant` 和 `size` props，传递给 `ScrollBar`
- **测试**：验证 variant 颜色类、size 宽度类

#### 3.3 Avatar — 添加 `variant` + `status`

- **文件**：`packages/ui/src/components/avatar/avatar-variants.ts`、`Avatar.vue`、`avatar.test.ts`
- **改动**：
  - `avatarVariants` 新增 `variant`（`default`/`primary`/`secondary`/`accent`，控制 fallback 背景色）
  - 组件新增 `status` prop（`online`/`offline`/`busy`/`none`），渲染右下角小圆点
  - 颜色：online=`bg-brutal-success`、offline=`bg-brutal-muted`、busy=`bg-brutal-destructive`
- **实现细节（关键）**：`avatarVariants` 基础类含 `overflow-hidden`（用于裁剪头像图片），若 status 圆点放在 `AvatarRoot` 内部会被裁掉。需采用**外层 wrapper** 结构：
  - Avatar.vue 根改为 `<span class="relative inline-block">` 包裹 `AvatarRoot`
  - status 圆点作为 wrapper 的子元素（`AvatarRoot` 的兄弟节点），使用 `absolute bottom-0 right-0 w-3 h-3 rounded-full border-3 border-brutal-bg`
  - `variant` prop 通过 provide 或额外 class 传给 `AvatarFallback`（fallback 在 AvatarRoot 内部，需单独接收 variant class）
- **测试**：验证 variant 类、status 指示器渲染、status 圆点不被裁剪（确认在 AvatarRoot 外层）

---

### 第 4 批：Progress + Slider 功能增强（2 个组件）

#### 4.1 Progress — 添加 `indeterminate` + `showLabel`

- **文件**：`packages/ui/src/components/progress/progress-variants.ts`、`Progress.vue`、`progress.test.ts`
- **改动**：
  - 组件新增 `indeterminate` prop（默认 `false`）
  - `indeterminate=true` 时忽略 `modelValue`，使用 CSS `animate-indeterminate` 动画（宽度 50% 从左到右循环滑动）
  - 组件新增 `showLabel` prop（默认 `false`），在进度条右侧或内部显示百分比文字
  - 需要在 `styles.css` 中新增 `@keyframes indeterminate` 动画定义
- **测试**：验证 indeterminate 动画类、showLabel 文字渲染、modelValue 正常模式

#### 4.2 Slider — 添加 `orientation` + `marks` + `tooltip`

- **文件**：`packages/ui/src/components/slider/slider-variants.ts`、`Slider.vue`、`slider.test.ts`
- **改动**：
  - 组件新增 `orientation` prop（`horizontal`/`vertical`），默认 `horizontal`
  - **必须将 `orientation` 透传给 `SliderRootPrimitive`**（reka-ui 原语原生支持该 prop，会自动处理 `aria-orientation` 与键盘方向键语义），仅改 CSS 会丢失无障碍方向语义
  - `vertical` 时 slider 容器使用 `flex-col h-full`，track 使用 `h-full w-auto`
  - 组件新增 `marks` prop（`number[]`），在对应位置渲染刻度标记
  - 组件新增 `showTooltip` prop（默认 `false`），拖拽时在 thumb 上方显示当前值
  - tooltip 使用绝对定位 + `SliderThumbPrimitive` 的 `@focus`/`@blur` 和 hover 事件控制显示
- **测试**：验证 orientation 布局、`aria-orientation` 属性、原语 orientation 透传、marks 渲染、tooltip 显示/隐藏

---

### 第 5 批：Section/Block 组件增强（4 个组件）

#### 5.1 Stepper — 添加 `variant` + `size` + `clickable`

- **文件**：`packages/ui/src/components/stepper/stepper-variants.ts`、`Stepper.vue`、`stepper.test.ts`
- **改动**：
  - `stepperDotVariants` 新增 `size`（`sm`/`default`/`lg`）——现状 dot 尺寸硬编码在 `state` 类中（`w-8 h-8`），需将尺寸从 state 类中抽出，state 仅保留颜色/阴影
  - `stepperDotVariants` 新增 `variant`（`default`/`primary`/`accent`），仅影响 active 状态颜色
  - 组件新增 `clickable` prop（默认 `true`），`false` 时步骤 dot 不可点击（`pointer-events-none`）
- **注意**：`stepperConnectorVariants` 已有 `orientation`（`horizontal`/`vertical`），本次不重复新增；Stepper.vue 若已暴露 orientation 透传给 connector，保持现状
- **测试**：验证 size 尺寸、variant 颜色、clickable 禁用

#### 5.2 Marquee — 添加 `variant` + `size`

- **文件**：`packages/ui/src/components/marquee/marquee-variants.ts`、`Marquee.vue`、`marquee.test.ts`
- **改动**：
  - `marqueeContainerVariants` 新增 `variant`（`default`/`primary`/`accent`/`muted`，控制背景色和边框色）
  - `marqueeContainerVariants` 新增 `size`（`sm`/`default`/`lg`，控制文字大小和 padding）
- **测试**：验证 variant 背景色、size 文字大小

#### 5.3 BeforeAfter — 添加 `orientation`

- **文件**：`packages/ui/src/components/before-after/BeforeAfter.vue`、`before-after.test.ts`
- **改动**：
  - 新增 `orientation` prop（`horizontal`/`vertical`），默认 `horizontal`
  - `vertical` 时 clipPath 改为 `inset(0 0 ${100 - sliderVal}% 0)`（从下到上裁剪 `after` 图）
  - 滑块线改为水平方向，handle 图标旋转 90 度
- **实现细节（关键）**：`before-after-variants.ts` 注释明确"手柄 `pointer-events-none`，交互由底层透明 range input 处理"。`vertical` 时需同步调整：
  - 透明 range input 的方向（writing-mode 或 transform 旋转 90 度，确保拖拽映射到垂直位移）
  - 手柄定位从 `top-1/2 -translate-y-1/2` 改为 `left-1/2 -translate-x-1/2`，保持 `pointer-events-none` 不变
  - 切勿移除底层 range input，否则交互失效
- **测试**：验证 horizontal/vertical 的 clipPath、布局、range input 方向映射

#### 5.4 Card3D — 添加 `variant` + `clickable`

- **文件**：`packages/ui/src/components/card-3d/card-3d-variants.ts`、`Card3D.vue`、`card-3d.test.ts`
- **改动**：
  - `card3dVariants` 新增 `variant`（`default`/`primary`/`accent`/`muted`，控制背景色）
  - 组件新增 `clickable` prop（默认 `false`），`true` 时添加 `cursor-pointer` 和 `click` emit
- **注意**：现状 `card3dVariants` 的 `shadow` 变体（`default`/`lg`/`xl`）三个值均为空字符串，属未完成实现。本次**不顺手修复**（避免越界改动），仅新增 `variant`；若 `shadow` 空值影响 `variant` 合并，需在 `cn()` 调用时确保空字符串被过滤
- **测试**：验证 variant 背景色、clickable cursor 和 click 事件

---

### 第 6 批：复杂块组件增强（3 个组件）

#### 6.1 CodeBlock — 添加 `maxLines` + 展开/折叠

- **文件**：`packages/ui/src/components/code-block/code-block-variants.ts`、`CodeBlock.vue`、`code-block.test.ts`
- **改动**：
  - 组件新增 `maxLines` prop（默认 `undefined`，不限制）
  - 当行数超过 `maxLines` 时，代码区域裁剪到 `maxLines` 行，底部显示"展开"按钮
  - 展开后显示"收起"按钮
  - 展开/收起按钮使用 `Button` 组件（`variant="outline" size="sm"`）
- **测试**：验证 maxLines 裁剪、展开/收起按钮交互

#### 6.2 Timeline — 添加 `alternate` 布局

- **文件**：`packages/ui/src/components/timeline/Timeline.vue`、`TimelineItem.vue`、`timeline-key.ts`、`timeline.test.ts`
- **改动**：
  - `Timeline.vue` 新增 `alternate` prop（默认 `false`）；`alternate` 仅在 `orientation='vertical'` 时生效，horizontal 时忽略并告警
  - `alternate=true` 时：偶数项内容在左侧、奇数项在右侧
  - `TimelineItem.vue` 新增 `index` prop（由 Timeline.vue 透传），根据 `alternate && index % 2` 计算自身侧别（`left`/`right`），调整布局方向
- **实现细节（关键）**：`timeline-key.ts` 中 `timelineOrientationKey` 承载的是 `vertical`/`horizontal` 朝向，**不可复用传递 `left`/`right` 侧别**。需新增独立注入键 `timelineAlternateKey`（`ComputedRef<boolean>`）传递 alternate 开关；侧别由 `TimelineItem` 根据 `index` 自行计算，避免逐项注入
- **测试**：验证 alternate 布局的左右交替、alternate 仅 vertical 生效、index 透传

#### 6.3 ChatBubble — 添加 `color` + `size`

- **文件**：`packages/ui/src/components/chat-bubble/chat-bubble-variants.ts`、`ChatBubble.vue`、`chat-bubble.test.ts`
- **改动**：
  - `chatBubbleVariants` 新增 `color` prop（`default`/`primary`/`accent`，仅影响 sent 气泡颜色；`received`/`system` 不受影响）
  - `chatBubbleVariants` 新增 `size`（`sm`/`default`/`lg`，控制文字大小和 padding）
  - `chatAvatarVariants` 新增 `size`（`sm`/`default`/`lg`）
- **命名说明（关键）**：现有 `variant` 已是 `sent`/`received`/`system`（语义角色），**不可复用 `variant` 名传递颜色**，否则 prop 冲突。颜色维度命名为 `color`，与 `variant` 正交组合（如 `variant="sent" color="primary"`）
- **测试**：验证 color 仅影响 sent 气泡颜色、size 文字大小和头像大小、variant 与 color 组合

---

### 第 7 批：数据组件功能增强（3 个组件）

#### 7.1 TreeView — 添加 `checkbox` 选择模式

- **文件**：`packages/ui/src/components/tree-view/TreeView.vue`、`TreeViewNode.vue`、`tree-view-variants.ts`、`tree-view.test.ts`、`index.ts`
- **改动**：
  - 组件新增 `selectionMode` prop（`single`/`checkbox`），默认 `single`
  - `checkbox` 模式下，每个节点前渲染 `Checkbox` 组件
  - 新增 `checkedIds`（`v-model`）和 `@update:checkedIds` 事件
  - 父节点选中时，子节点自动全选（cascade）；子节点部分选中时，父节点显示半选状态
  - `TreeNode` 类型新增 `disabled?: boolean`
- **实现细节（关键）**：TreeView 是**自定义 ARIA 实现**（`role="tree"`/`role="treeitem"` 手写，非 reka-ui 原语）。checkbox 模式需手动处理：
  - `role="treeitem"` 上新增 `aria-checked`（`true`/`false`/`mixed`），半选状态用 `aria-checked="mixed"`
  - 键盘交互：Space 切换选中、Enter 触发 select；需与现有方向键导航（`handleFocusPrev/Next/Parent/FirstChild`）协调
  - 级联逻辑在 `TreeView.vue` 集中计算（避免子节点各自维护），通过 props 下发选中状态给 `TreeViewNode`
  - `SelectionMode` 类型从 `TreeView.vue` 导出，同步到 `index.ts`
- **测试**：验证 checkbox 渲染、选中/取消、级联选中、半选状态、`aria-checked` 语义

#### 7.2 KanbanBoard — 添加列拖拽 + 内置 add-card

- **文件**：`packages/ui/src/components/kanban/KanbanBoard.vue`、`kanban-variants.ts`、`kanban.test.ts`
- **改动**：
  - 新增 `column-move` 事件，支持列标题拖拽排序（列容器新增 `draggable="true"` 与 `@dragstart`/`@dragover`/`@drop` 处理，复用现有 card 拖拽模式但作用于列）
  - 每个列底部新增 `add-card` 事件
- **实现细节（关键）**：KanbanBoard **已有** `<slot :name="`add-${col.id}`" />`（按列名动态插槽），不新建通用 `add-card` 插槽。改为：
  - 在现有 `add-${col.id}` 插槽位置添加**默认 fallback 内容**：当插槽未被子组件填充时，渲染一个 `+` 按钮（`Button variant="outline" size="sm"`）
  - `+` 按钮点击时 emit `add-card`（传 `columnId`）
  - 用户既可用默认 `+` 按钮，也可用 `#add-{colId}` 插槽自定义
- **测试**：验证列拖拽排序、默认 `+` 按钮渲染、`add-card` 事件、自定义插槽覆盖默认按钮

#### 7.3 VirtualScroll — 添加 `scrollToIndex`

- **文件**：`packages/ui/src/components/virtual-scroll/VirtualScroll.vue`、`virtual-scroll.test.ts`
- **改动**：
  - 通过 `defineExpose` 暴露 `scrollToIndex(index: number)` 方法
  - 内部调用 `virtualizer.value.scrollToIndex(index)`
- **测试**：验证 scrollToIndex 方法暴露和调用

---

### 第 8 批：表单/交互组件增强（3 个组件）

#### 8.1 FeedbackForm — 添加 `loading` + `success` 状态

- **文件**：`packages/ui/src/components/feedback-form/FeedbackForm.vue`、`feedback-form.test.ts`
- **改动**：
  - 组件新增 `loading` prop（默认 `false`），submit 时 Button 显示 loading spinner
  - 组件新增 `success` prop（默认 `false`），`true` 时显示成功卡片替换表单
  - 成功卡片使用 `SuccessCard` 组件
  - 新增 `successTitle` 和 `successDescription` props
- **依赖确认**：`SuccessCard` 已存在于 `packages/ui/src/components/success-card/` 并从 `index.ts` 导出；`Button` 已有 `loading` prop（内部渲染 `Loader2`）。本节只需将 `loading` 透传给 `Button`、用 `v-if="success"` 切换表单与 `SuccessCard`
- **测试**：验证 loading 透传到 Button、success 状态渲染 SuccessCard、successTitle/successDescription 透传

#### 8.2 SearchWidget — 添加 `loading` + `recent` 功能

- **文件**：`packages/ui/src/components/search-widget/SearchWidget.vue`、`search-widget.test.ts`
- **改动**：
  - 组件新增 `loading` prop（默认 `false`），搜索时显示 Spinner（复用 `Spinner` 组件）
  - 组件新增 `recent` prop（`SearchSuggestion[]`），在输入框为空时显示"最近搜索"分组
  - 最近搜索项可点击回填
- **实现细节（关键）**：现状 `CommandList` 用 `v-if="query"` 控制显示（仅查询时显示建议）。`recent` 需在 query 为空时显示，故需新增**并列分支**：
  - `<CommandList v-if="query">`（现有，显示搜索建议）+ 底部 `<Spinner v-if="loading" />`
  - `<CommandList v-else-if="recent.length">`（新增，显示最近搜索，用 `CommandGroup heading="最近搜索"`）
  - 点击 recent 项时回填 query 并 emit `select`
- **测试**：验证 loading spinner、recent 分组渲染、query 空时 recent 显示、query 非空时建议显示、recent 回填

#### 8.3 Combobox — 添加 `loading` + `creatable`

- **文件**：`packages/ui/src/components/combobox/Combobox.vue`、`ComboboxMulti.vue`、`combobox.test.ts`
- **改动**：
  - 组件新增 `loading` prop（默认 `false`），搜索时列表底部显示 Spinner（复用 `Spinner` 组件）
  - 组件新增 `creatable` prop（默认 `false`），输入无匹配项时显示"创建 '{query}'"选项
  - 选择创建项时 emit `create` 事件（传搜索文本）
  - `ComboboxMulti` 同步支持 `loading` 和 `creatable`
- **实现细节（关键）**：Combobox 基于 `Command` 组件体系（`CommandList`/`CommandEmpty`/`CommandGroup`），集成时注意：
  - `loading`：在 `CommandList` 内部底部追加 `<Spinner v-if="loading" />`，不影响现有 `CommandEmpty` 渲染逻辑
  - `creatable`：当 `filteredOptions` 为空且 `searchQuery` 非空时，用 `CommandItem`（`@select` 触发 `emit('create', searchQuery)`）替代 `CommandEmpty` 渲染"创建"项；非空时 `CommandEmpty` 正常显示。即 `creatable` 改变的是空状态的渲染分支，而非新增并列项
  - `creatable` 创建项的 `value` 用 `searchQuery`，确保 `handleSelect` 能识别
- **测试**：验证 loading 指示器、creatable 选项渲染、create 事件、creatable 与空状态分支切换

---

## 约定与决策

- **变体命名**：统一使用 `default`/`primary`/`secondary`/`accent`/`success`/`danger`/`muted`/`outline`，与现有 Badge/Button/Alert 保持一致
- **尺寸命名**：历史原因导致现状分裂——Kbd、Counter 用 `sm`/`md`/`lg`（`xl`），Avatar、Progress、Slider 用 `sm`/`default`/`lg`。本次拓展**不做统一迁移**（避免破坏性改动），遵循以下规则：
  - 既有 `size` 的组件（Kbd、Counter）：保留 `md` 命名，新增 `variant` 时不触碰 `size`
  - 新增 `size` 的组件（Label、Separator、Skeleton、Stepper dot、Marquee、ChatBubble、ScrollArea）：统一采用 `sm`/`default`/`lg`（与 Avatar/Progress/Slider 一致，这些是较新组件的主流约定）
- **默认值**：所有新增 prop 默认值保持现有行为不变（向后兼容）
- **国际化**：需要新增文本的组件，在对应 locale 文件中追加 key，使用 `useLocale()` 的 `t()` 提供默认值
- **注册表**：variant 文件已在 `COMPONENT_FILES` 中登记，无需新增注册表条目；仅新增的 locale key 需要检查
- **CSS**：新增动画（如 Progress indeterminate）在 `packages/ui/src/styles.css` 中定义
- **导出**：新增的类型（如 `TreeView` 的 `SelectionMode`）在 `packages/ui/src/index.ts` 中同步导出

## 验证步骤

每批完成后执行：
1. `pnpm lint` — 代码规范检查
2. `pnpm typecheck` — 类型检查
3. `pnpm test` — 全部测试通过（含新增测试）
4. `pnpm --filter brutx-registry-vue build && pnpm --filter brutx-registry-vue validate` — 注册表验证
5. 最终全部门禁：`pnpm release:check`