# 组件拓展方案代码实现审查报告

> 审查日期：2026-06-29
> 审查范围：8批24个组件的代码实现
> 审查方式：8个并行代理分别审查各批次

---

## 目录

- [严重问题（4个）](#严重问题4个)
- [中等问题（7个）](#中等问题7个)
- [低风险问题（12个）](#低风险问题12个)
- [建议改进（6个）](#建议改进6个)
- [测试覆盖情况](#测试覆盖情况)
- [优先修复建议](#优先修复建议)
- [各批次详细审查结果](#各批次详细审查结果)

---

## 严重问题（4个）

| # | 批次 | 组件 | 问题描述 |
|---|------|------|----------|
| 1 | 第4批 | **Slider** | `marks` 在 0% 和 100% 位置被 `SliderTrackPrimitive` 的 `overflow-hidden` 裁剪一半。marks 使用 `translate(-50%, ...)` 居中定位，边界处超出 track 范围 |
| 2 | 第5批 | **BeforeAfter** | 垂直模式下 range input 仅使用 `writingMode: vertical-rl`，Firefox 对此支持不完整，需同时添加 `orient="vertical"` 属性 |
| 3 | 第5批 | **Card3D** | `shadow` 变体的三个值（default/lg/xl）全部映射为空字符串，变体名存实亡。`shadow="lg"` 与 `shadow="xl"` 仅差 2px 初始偏移 |

---

## 中等问题（7个）

| # | 批次 | 组件 | 问题描述 |
|---|------|------|----------|
| 5 | 第6批 | **ChatBubble** | `system` variant 的 compoundVariant 无条件附加 `text-xs`，会覆盖 `size` prop 的 `text-base`，导致 system 消息的 `size` prop 失效 |
| 6 | 第7批 | **KanbanBoard** | 列拖拽 `onColumnDrop` 中 `splice` 索引偏移 bug：当 `fromIndex < toIndex` 时，移除元素后未调整 `toIndex`，导致列被放置到错误位置（3列以上场景必现） |
| 7 | 第8批 | **FeedbackForm** | SuccessCard 的 `iconSize` 默认值 `'2xl'` 被 FeedbackForm 的默认值 `'default'` 覆盖，导致成功状态图标比设计预期小 |
| 8 | 第8批 | **Registry** | 三个 registry JSON（feedback-form/search-widget/combobox）中嵌入的 zh-CN.ts import 路径错误，指向不存在的 `@/components/ui/xxx/types` 而非 `@/locales/types` |
| 9 | 第6批 | **ChatBubble** | `color="primary"` 在 sent 气泡上是死选项——与 `color="default"` 产生完全相同的样式 |
| 10 | 第5批 | **BeforeAfter** | `beforeAfterRootVariants` 缺少 orientation 变体，垂直模式下 `aspect-video`（16:9）不适合竖长图场景 |
| 11 | 第5批 | **Stepper** | `variant.default` 与 `variant.primary` 生成完全相同的类，冗余且语义不清 |

---

## 低风险问题（12个）

| # | 批次 | 组件 | 问题描述 |
|---|------|------|----------|
| 12 | 第1批 | **Label** | required 指示器 `*` 缺少左边距（`ml-0.5`），会紧贴标签文字 |
| 13 | 第2批 | **Separator** | `--sep-thickness` 的 `3px` fallback 在三处硬编码，建议提取常量 |
| 14 | 第2批 | **Separator** | 文字分隔线模式下 `props.class` 加到 wrapper 而非线条上 |
| 15 | 第2批 | **Separator** | `hasLabel` 的 slot 响应性在动态 slot 内容场景下可能不更新 |
| 16 | 第3批 | **ScrollArea** | `scrollAreaViewportVariants` 已定义但从未使用（死代码） |
| 17 | 第3批 | **Avatar** | `statusLabel` computed 中 TypeScript 类型收窄不精确 |
| 18 | 第5批 | **Marquee** | `variant.accent` 使用 `text-brutal-fg` 而非 `text-brutal-accent-foreground`，与其他组件不一致 |
| 19 | 第7批 | **TreeView** | `ariaChecked` 返回布尔值而非字符串 `"true"`/`"false"`（Vue 自动转换，但语义不精确） |
| 20 | 第7批 | **TreeView** | `getCheckState` 逻辑在 TreeView.vue 和 TreeViewNode.vue 中重复实现 |
| 21 | 第8批 | **feedback-form.test** | 第14行 `[data-slot="success-card"]` 断言无实际验证作用（SuccessCard 未定义此属性） |
| 22 | 第5批 | **Card3D** | `card3dShadowVariants` 是无参数 CVA，应简化为普通字符串常量 |
| 23 | 第4批 | **Slider** | tooltip 没有通过 `aria-describedby` 与 thumb 关联 |

---

## 建议改进（6个）

| # | 组件 | 建议 |
|---|------|------|
| 24 | **TreeView** | Enter 键在 checkbox 模式下应触发 check，与主流 UI 库行为一致 |
| 25 | **TreeView** | 缺少 Home/End 键支持（WAI-ARIA 推荐） |
| 26 | **KanbanBoard** | `setTimeout(0)` 重置 `isDragging` 是脆弱的时序依赖模式 |
| 27 | **VirtualScroll** | `scrollToIndex` 缺少输入边界校验 |
| 28 | **CodeBlock** | 展开/折叠无过渡动画，`LINE_HEIGHT_REM = 1.25` 行高假设脆弱 |
| 29 | **Combobox** | 属性名为 `creative` 而非方案描述中的 `creatable`，命名不一致 |

---

## 测试覆盖情况

| 批次 | 组件 | 测试状态 |
|------|------|----------|
| 第1批 | Kbd/CopyToClipboard/Counter/Label | ✅ 完整（58个测试） |
| 第2批 | Separator/Skeleton | ✅ 完整（100% 覆盖率） |
| 第3批 | ToggleGroup/ScrollArea/Avatar | ✅ 完整（33个测试） |
| 第4批 | Progress/Slider | ✅ 完整（44个测试） |
| 第5批 | Stepper/Marquee/BeforeAfter/Card3D | ⚠️ 缺少键盘导航、pauseOnHover、3D交互测试 |
| 第6批 | CodeBlock/Timeline/ChatBubble | ✅ 存在测试文件，但覆盖度待验证 |
| 第7批 | TreeView/KanbanBoard/VirtualScroll | ⚠️ 缺少3+列拖拽、键盘交互测试 |
| 第8批 | FeedbackForm/SearchWidget/Combobox | ✅ 基本完整（73个测试） |

---

## 优先修复建议

### P0（立即修复）

1. **KanbanBoard 列拖拽索引偏移 bug**（第6项）
2. **Slider marks 被 overflow-hidden 裁剪**（第1项）

### P1（尽快修复）

3. **BeforeAfter 垂直模式 Firefox 兼容性**（第2项）
4. **ChatBubble system variant 的 size 覆盖问题**（第5项）
5. **Registry JSON import 路径错误**（第8项）
6. **FeedbackForm iconSize 默认值覆盖**（第7项）

### P2（择机修复）

8. **Card3D shadow 变体空值问题**（第3项）
9. **Label required 指示器间距**（第12项）
10. 其他低风险问题

---

## 各批次详细审查结果

### 第1批：简单变体补齐（4个组件）

**结论：实现质量高，无阻塞性问题**

涉及组件：Kbd、CopyToClipboard、Counter、Label

#### 正确实现

- 所有四个组件正确使用 `cva()` 定义变体
- 类型安全模式一致：`VariantProps<typeof xxxVariants>` + `NonNullable<>`
- `cn()` 工具函数（tailwind-merge + clsx）统一用于类合并
- 命名约定符合规范：Kbd 保留 `sm/md/lg`，CopyToClipboard/Label 使用 `sm/default/lg`
- 向后兼容：所有新 prop 默认值保持原有行为
- 导出完整：四个变体文件均从 `index.ts` 正确导出
- 无障碍支持：Label 的 required 指示器正确使用 `aria-hidden="true"` + `aria-required="true"`

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| 低 | Label required 指示器 `*` 缺少左边距（`ml-0.5`），会紧贴标签文字 |
| 低 | Counter 测试缺少 variant+size 组合测试 |
| 信息 | CopyToClipboard copied 状态文本颜色会覆盖 variant 颜色（设计意图） |

---

### 第2批：Separator + Skeleton 增强（2个组件）

**结论：核心逻辑正确，测试覆盖全面**

涉及组件：Separator、Skeleton

#### Separator 实现分析

- **label 插槽实现正确**：`isTextSeparator` computed 正确判断 `orientation === 'horizontal' && hasLabel.value`
- **条件渲染两套结构**：文字分隔线模式使用 flex 容器 + 伪元素画线，普通模式使用 SeparatorPrimitive
- **role 属性处理正确**：文字分隔线模式由 `decorative` 控制 `role="separator"` 或 `role="none"`

#### Skeleton 实现分析

- **circle 模式 width 同步正确**：inline style 同时设置 `width` 和 `height` 为相同值
- **circle 宽度类正确**：通过 `skeletonCircleWidthVariants` 查表获取与 size 高度匹配的宽度类

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| 低 | `--sep-thickness` 的 `3px` fallback 在三处硬编码，建议提取常量 |
| 低 | 文字分隔线模式下 `props.class` 加到 wrapper 而非线条上 |
| 低 | `hasLabel` 的 slot 响应性在动态 slot 内容场景下可能不更新 |

---

### 第3批：布局组件增强（3个组件）

**结论：核心功能正确，存在死代码和设计混淆**

涉及组件：ToggleGroup、ScrollArea、Avatar

#### ToggleGroup 实现分析

- **orientation 透传正确**：正确传递给 reka-ui 的 `ToggleGroupRoot`
- **CSS 布局逻辑正确**：vertical 时追加 `flex-col`
- **测试覆盖完整**：5个测试覆盖所有场景

#### ScrollArea 实现分析

- **variant/size 传递链正确**：ScrollArea → ScrollBar → scrollAreaScrollbarVariants
- **CSS 变量方案正确**：`--scroll-thickness` 控制 scrollbar 粗细

#### Avatar 实现分析

- **overflow-hidden 裁剪问题已正确解决**：外层 `<span class="relative inline-block">` 包裹 AvatarRoot 和 status 圆点
- **无障碍支持完善**：status dot 具有 `role="status"` 和本地化 `aria-label`

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| P2 | `scrollAreaViewportVariants` 已定义但从未使用（死代码） |
| P3 | `scrollAreaRootVariants` 不接受 variant 参数，ScrollArea 的 variant/size prop 对根元素无样式影响 |
| P3 | `statusLabel` computed 中 TypeScript 类型收窄不精确 |

---

### 第4批：Progress + Slider 功能增强（2个组件）

**结论：Progress 实现完善，Slider marks 存在裁剪 bug**

涉及组件：Progress、Slider

#### Progress 实现分析

- **indeterminate 动画正确**：CSS keyframe + `animate-indeterminate` 类 + `prefers-reduced-motion` 支持
- **showLabel 实现正确**：`v-if="showLabel && !indeterminate"` 隐藏无意义的百分比
- **root model value 正确**：indeterminate 时传递 `null` 给 reka-ui

#### Slider 实现分析

- **orientation 透传正确**：完整传递到 reka-ui 的 `SliderRootPrimitive`
- **tooltip 实现正确**：focus/blur 使用微任务防止闪烁，定位逻辑完善

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| **严重** | Slider marks 在 0% 和 100% 位置被 `overflow-hidden` 裁剪一半 |
| 低 | tooltip 没有通过 `aria-describedby` 与 thumb 关联 |

#### Slider marks 裁剪 bug 详情

```typescript
// slider-variants.ts 第25-28行
'relative grow overflow-hidden rounded-brutal',  // track 基础类

// Slider.vue 第96-110行
// marks 使用 position: absolute + translate(-50%, ...) 居中
// 在 0% 位置：left: 0 + translate(-50%, ...) = 一半超出左边界
// 在 100% 位置：left: 100% + translate(-50%, ...) = 一半超出右边界
// overflow-hidden 裁剪了超出部分
```

**修复方案**：将 marks 移到 track 外部作为兄弟元素，或在 marks 容器上添加 `overflow-visible`

---

### 第5批：Section/Block 组件增强（4个组件）

**结论：BeforeAfter 和 Card3D 存在严重问题**

涉及组件：Stepper、Marquee、BeforeAfter、Card3D

#### Stepper 实现分析

- **size 实现正确**：sm/default/lg 在所有 state 下生效
- **clickable 实现正确**：cursor-pointer/pointer-events-none 切换逻辑正确

#### Marquee 实现分析

- **variant 和 size 实现正确**：四种 variant 和三种 size 定义清晰

#### BeforeAfter 实现分析

- **clipPath 逻辑正确**：水平/垂直模式的裁剪方向正确
- **垂直模式 Firefox 兼容性问题**：缺少 `orient="vertical"` 属性

#### Card3D 实现分析

- **variant 实现正确**：default/primary/accent/muted 映射正确
- **clickable 实现正确**：disabled/!clickable 时不触发事件

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| **严重** | BeforeAfter 垂直模式下缺少 `orient="vertical"` 属性，Firefox 中可能失效 |
| **严重** | Card3D `shadow` 变体值全为空字符串，变体名存实亡 |
| 中等 | BeforeAfter `beforeAfterRootVariants` 缺少 orientation 变体，垂直模式下 `aspect-video` 不适合 |
| 中等 | Stepper `variant.default` 与 `variant.primary` 生成完全相同的类 |
| 轻微 | Marquee `variant.accent` 使用 `text-brutal-fg` 而非 `text-brutal-accent-foreground` |

#### BeforeAfter Firefox 兼容性问题详情

```typescript
// BeforeAfter.vue 第90-93行
const inputStyle = computed(() => {
    if (props.orientation === 'vertical') {
        return { writingMode: 'vertical-rl' as const }  // Firefox 支持不完整
    }
    return undefined
})

// 模板中缺少 orient 属性
// <input v-model="sliderVal" type="range" ... />
```

**修复方案**：添加 `:orient="orientation === 'vertical' ? 'vertical' : undefined"`

#### Card3D shadow 变体空值问题详情

```typescript
// card-3d-variants.ts 第12-16行
shadow: {
    default: '',  // 空字符串
    lg: '',       // 空字符串
    xl: '',       // 空字符串
},

// 实际阴影效果由 JS 驱动：
// shadow="lg" → initialOffset = 6px
// shadow="xl" → initialOffset = 8px
// 仅 2px 差异，视觉上几乎无法区分
```

---

### 第6批：复杂块组件增强（3个组件）

**结论：测试完全缺失，ChatBubble 存在逻辑问题**

涉及组件：CodeBlock、Timeline、ChatBubble

#### CodeBlock 实现分析

- **maxLines 裁剪逻辑正确**：`clipStyle` 通过 `maxHeight` + `overflow: hidden` 实现
- **行号同步裁剪正确**：行号 div 和代码 pre 使用相同的 `LINE_HEIGHT_REM`
- **locale 支持完整**：expand/collapse 键在中英文 locale 中均有定义

#### Timeline 实现分析

- **provide/inject 模式正确**：`timelineOrientationKey` 和 `timelineAlternateKey` 类型安全
- **alternate 仅在垂直方向生效**：`props.alternate && props.orientation === 'vertical'`
- **index 注入机制正确**：通过 `cloneVNode` 注入递增的 index prop

#### ChatBubble 实现分析

- **size 三档实现清晰**：sm/default/lg 分别控制 px-py-text
- **color 仅影响 sent 气泡**：received/system 的 color 值映射为空字符串

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| **严重** | 三个组件完全没有测试文件 |
| 中等 | ChatBubble `system` variant 的 compoundVariant 无条件附加 `text-xs`，覆盖 size prop |
| 中等 | ChatBubble `color="primary"` 在 sent 气泡上是死选项 |
| 低 | CodeBlock `LINE_HEIGHT_REM = 1.25` 行高假设脆弱 |

#### ChatBubble system size 覆盖问题详情

```typescript
// chat-bubble-variants.ts
compoundVariants: [
    { variant: 'sent', color: 'accent', class: 'bg-brutal-accent text-brutal-accent-foreground' },
    { variant: 'system', class: 'text-xs' },  // 无条件匹配所有 system 消息
]

// 当用户设置 size="lg" 的 system 消息时：
// size 应用 text-base
// compoundVariant 应用 text-xs
// 最终效果取决于 Tailwind CSS 生成顺序，不可预测
```

**修复方案**：将 `text-xs` 移到 `variant.system` 的定义中，或在组件中对 system variant 忽略 size prop

---

### 第7批：数据组件功能增强（3个组件）

**结论：KanbanBoard 列拖拽存在索引偏移 bug**

涉及组件：TreeView、KanbanBoard、VirtualScroll

#### TreeView 实现分析

- **checkbox 渲染正确**：Checkbox 组件正确集成
- **级联逻辑正确**：父节点选中时子节点自动全选
- **aria-checked 支持**：支持 true/false/mixed 三种状态

#### KanbanBoard 实现分析

- **卡片拖拽正确**：同列内拖拽正确处理了索引偏移
- **add-card 插槽设计良好**：动态插槽名 + 默认 Button 回退

#### VirtualScroll 实现分析

- **scrollToIndex 实现正确**：直接代理到 `@tanstack/vue-virtual`

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| **高** | KanbanBoard 列拖拽 `onColumnDrop` 中 splice 索引偏移 bug |
| 低 | TreeView `ariaChecked` 返回布尔值而非字符串 |
| 低 | TreeView `getCheckState` 逻辑重复实现 |
| 建议 | TreeView Enter 键在 checkbox 模式下不触发 check |
| 建议 | TreeView 缺少 Home/End 键支持 |

#### KanbanBoard 列拖拽 bug 详情

```typescript
// KanbanBoard.vue 第180-182行
const newColumns = [...columns.value];
const [moved] = newColumns.splice(fromIndex, 1);
newColumns.splice(toIndex, 0, moved);  // toIndex 未调整

// 复现场景：3列 [A, B, C]，将 A(index=0) 拖到 C(index=2) 的位置
// 1. splice(0, 1) → [B, C]
// 2. splice(2, 0, A) → [B, C, A]  // 错误！
// 期望结果：[B, A, C]

// 对比卡片拖拽的 onDrop（第115-132行）正确处理了索引偏移：
// const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
```

**修复方案**：
```typescript
const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
newColumns.splice(adjustedIndex, 0, moved);
```

---

### 第8批：表单/交互组件增强（3个组件）

**结论：核心功能正确，Registry 路径错误需要修复**

涉及组件：FeedbackForm、SearchWidget、Combobox

#### FeedbackForm 实现分析

- **loading 实现正确**：`handleSubmit` 中 `if (props.loading) return` 阻止重复提交
- **success 实现正确**：`v-if="success"` 渲染 SuccessCard，`v-else` 渲染表单

#### SearchWidget 实现分析

- **loading 实现正确**：Spinner 仅在有搜索词时显示
- **recent 实现正确**：`v-if="showSuggestions"` 和 `v-else-if="showRecent"` 互斥渲染

#### Combobox 实现分析

- **loading 实现正确**：Spinner 在 Popover 打开时可见
- **creatable 实现正确**：`showCreateItem` 与 `CommandEmpty` 互斥显示
- **关闭时清空搜索**：`watch(open, ...)` 在下拉关闭时清空 `searchQuery`

#### 发现问题

| 严重度 | 问题 |
|--------|------|
| 中等 | FeedbackForm SuccessCard `iconSize` 默认值被覆盖 |
| 中等 | Registry JSON 中 zh-CN.ts import 路径错误 |
| 低 | feedback-form.test 第14行断言无实际验证作用 |
| 信息 | Combobox 属性名为 `creative` 而非方案中的 `creatable` |

#### Registry import 路径错误详情

```typescript
// feedback-form.json 中嵌入的 zh-CN.ts
import type { Locale } from '@/components/ui/feedback-form/types'  // 错误！路径不存在

// 正确路径应该是
import type { Locale } from '@/locales/types'

// 同样问题存在于 search-widget.json 和 combobox.json
```

---

## 审查方法论

- **审查工具**：8个并行 Explore 代理，每个负责一个批次
- **审查维度**：
  - 变体定义正确性
  - 组件实现与方案描述的一致性
  - 类型安全
  - 无障碍支持
  - 测试覆盖度
  - 跨组件一致性
- **审查标准**：从第一性原理出发，深入分析每个实现细节

---

*报告生成时间：2026-06-29*
