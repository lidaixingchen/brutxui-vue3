# 兼容性包袱审查报告（补遗）

全量扫描 96 个组件目录，按问题类别汇总。本报告由 5 个并行 Explore 代理分别负责 v-model/默认值双模式、命名不一致、死代码、类型副作用、样式与无障碍 5 个维度。

---

## 一、defaultValue/defaultXxx 双模式（4 处双轨 + 4 处单轨无受控对端）

### 1.1 双轨透传 reka-ui

| 组件 | 文件 | 问题 |
|---|---|---|
| Slider | `Slider.vue:25,151` | `defaultValue` + `modelValue` 双轨透传 SliderRoot |
| Tabs | `Tabs.vue:7,28` | `defaultValue` + `modelValue` 双轨透传 TabsRoot |
| TabsNav | `TabsNav.vue:19,41` | `defaultValue` + `modelValue` + `activeValue` 三重回退 |
| ToggleGroup | `ToggleGroup.vue:13,53` | `defaultValue` + `modelValue` 双轨（与 Toggle 是**不同**组件） |

**修复**：删除 `default*` prop 与对应透传，仅保留 `modelValue`/`v-model`。

### 1.2 单轨无受控对端（父级无法受控）

| 组件 | 文件 | 问题 |
|---|---|---|
| TreeView | `TreeView.vue:26` | `defaultExpanded` 但无 `v-model:expanded`，仅 emit `expand` 事件，与同组件 `modelValue`/`checkedIds` 受控双轨不一致 |
| BeforeAfter | `BeforeAfter.vue:17` | `defaultValue` 无 `modelValue`/`update:modelValue`，`<input v-model="sliderVal">` 仅内部 ref |
| PricingSection | `PricingSection.vue:45` | `defaultBilling` 无 `modelValue`，仅 emit `plan-select`，父级无法受控计费周期 |
| SettingsPage | `SettingsPage.vue:27` | `defaultTab` 无 `modelValue`，`activeTab` 仅内部 ref |

**修复**：补齐 `modelValue` + `update:modelValue` 受控 API，或显式声明为纯内部状态并删除 `default*` prop。

### 1.3 弹层受控面不一致

Combobox/ColorPicker/DatePicker 系列/TreeSelect 把 `open` 完全内部化（`<PopoverRoot v-model:open="open">` 用内部 ref），仅 `CommandDialog.vue:12` 暴露 `v-model:open` 受控——同类弹层组件受控面不统一。

---

## 二、命名不一致

### 2.1 emit camelCase 不一致

| 组件 | 文件 | 当前 emit | 应改为 |
|---|---|---|---|
| HardcoreInput | `HardcoreInput.vue:38` | `validationChange` | `validation-change` |
| FormWizard | `FormWizard.vue:50,52` | `stepChange`、`validationError`（同文件 `navigation-blocked` 已是 kebab，**风格混用**） | `step-change`、`validation-error` |
| ErrorCard | `ErrorCard.vue:34` | `dismiss` | 应统一为 `close`（与 Alert/Badge/Toast 同义） |
| Pagination | `Pagination.vue:40` | `update:currentPage`（自定义 v-model） | 应统一为 `update:modelValue`，与 DataTable `page-change` 也需对齐 |

### 2.2 prop / slot / expose 同义不同名

| 组件 | 文件 | 问题 |
|---|---|---|
| CommandGroup | `CommandGroup.vue:8` | `heading` prop，库内其余组件（AuthCard/BlogCard/CookieConsent/EmptyState/ErrorCard/FeedbackForm/GallerySection/ProfilePage/SettingsPage）统一用 `title` |
| Alert | `Alert.vue:46` | slot `action`（单数），其余 9 个组件（BlogCard/CookieConsent/ErrorCard/FileCard/QuickActions/SearchWidget/SuccessCard/TestimonialCard/UploadCard）均用复数 `actions` |
| StepperSection | `StepperSection.vue:98,109` | 同组件同时定义 `content` 与 `default` 两个语义重叠 slot，`default` 嵌套在 `content` 默认值内 |
| Counter | `Counter.vue:104` | expose `start`/`stop`，而 GlitchButton `:142` / GlitchText `:103` expose `play`/`stop`，动画控制应统一 |

---

## 三、死代码与重复实现

| 类别 | 文件 | 问题 |
|---|---|---|
| 未使用 prop | `DatePicker.vue:23,25` | `mode`、`valueFormat` 全程未引用 |
| 未使用 prop | DatePickerRange/DateTimePicker/WeekPicker/MonthPicker/YearPicker 各 `:24` | `valueFormat`/`timeFormat` 未引用 |
| 未使用 variant 导出 | `tree-view-variants.ts:24` | `treeBranchLineVariants` 全库无 import（仅 `treeItemVariants` 被 TreeViewNode 使用） |
| 未使用类型导出 | `virtual-scroll/types.ts:32` | `VirtualScrollSlots` 全库无 import |
| 死类型/死函数 | `lib/date.ts:1,91,98` | `DateValueFormat` 类型、`toValueFormat`/`fromValueFormat` 函数仅被测试引用，无生产代码使用 |
| 死字段 | `data-table/types.ts:32,33` | 列级 `DataTableColumn.filterable`/`resizable` 全库无 `column.filterable`/`col.resizable` 引用 |
| registry 缺失 | `packages/registry/scripts/component-files.ts:17,60` | `DialogEnhanced.vue`/`CarouselEnhanced.vue` 已在 `src/index.ts` 导出，但 registry 文件列表缺失 → CLI `add` 不会安装这两个组件 |
| 重复实现 | DatePicker 6 个触发组件 + `DatePicker.vue:73-77` | 内联 `size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'` 三元链计算图标尺寸，未复用项目共享 `iconSizeVariants` CVA（其他组件如 Alert/AuthCard/Badge/Button 已正确复用） |

---

## 四、类型与 TS 副作用

### 4.1 冗余断言

| 文件 | 行号 | 代码 | 说明 |
|---|---|---|---|
| `FormControl.vue` / `FormLabel.vue` / `FormMessage.vue` | 16 / 13 / 12 | `ref<string \| undefined>(undefined) as Ref<string \| undefined>` | `ref<T>()` 已返回 `Ref<T>`，断言纯冗余 |
| `TreeSelectNode.vue` | 88 | `parentElement as HTMLElement \| null` | DOM lib 已是该类型 |
| `Pagination.vue` | 188, 190 | `pageNumber as number` | v-for 联合类型 `number \| 'dots'` 在 v-else 分支未正确收窄 |
| `TreeSelect.vue` | 119, 235 | `.filter(Boolean) as TreeNode[]` | **对 TS 撒谎的危险断言**，`filter(Boolean)` 在 TS 中不收窄 undefined |
| `ToastContainer.vue` | 42 | `props.position as PositionKey` | `typeof === 'string'` 后仍为宽 `string`，断言不安全 |

### 4.2 类型声明不一致

| 问题 | 位置 |
|---|---|
| 16 字段内联 `defineProps<{...}>()` 未抽 interface | `DataTable.vue:43-60` |
| 9 处用裸 `Props` 而非 `XxxProps`：AccordionItem:11、ColorPicker:17、DatePicker:16、DatePickerRange:16、DateTimePicker:16、MonthPicker:16、WeekPicker:16、YearPicker:16、TagsInputItem:10、TimelineDot:9 | 各对应 `.vue` |
| 3 处用 `const emits =`（Accordion:7、NumberInput:32、TagsInput:8），其余全用 `const emit =` | 各对应 `.vue` |
| `withDefaults` 对可选 prop 显式 `undefined` 冗余 | `DataTable.vue:69,70` |

### 4.3 CVA 空变体值

| 文件 | 行号 | 空值键 |
|---|---|---|
| `chat-bubble-variants.ts` | 18-20 | default/primary/accent 均 `''` |
| `color-picker-variants.ts` | 48 | `false: ''` |
| `combobox-variants.ts` | 10 | `true: ''` |
| `date-picker-variants.ts` | 23, 55 | default / `false: ''` |
| `tabs-variants.ts` | 16 | `horizontal: ''` |
| `tree-select-variants.ts` | 41 | `false: ''`（注意 tree-select ≠ tree-view） |

### 4.4 Boolean 变体 `true | undefined` 陷阱

下列 variant 只声明 `true: '...'` 不声明 `false`，CVA 类型推断为 `true | undefined`，调用方传 `false` 会触发类型错误：

| 文件 | 键 |
|---|---|
| `data-table-variants.ts` | sortable:38、active:46、striped:69、dense:96、active:99 |
| `kanban-variants.ts` | dragOver:12、dragging:30、dragOver:33、dragging:55 |
| `marquee-variants.ts` | fade:11、pauseOnHover:44 |
| `tree-view-variants.ts` | selected:14 |

**修复**：补 `false: ''` 维持 `boolean` 语义，或用 `pnpm typecheck` 验证后重构。

### 4.5 其他

- 源码无 `as any` / `as unknown as` / `@ts-nocheck`；`@ts-expect-error` 仅 2 处（Carousel:33、CarouselEnhanced:61），均注释说明 vue-tsc 模板 ref 限制，合理使用。
- 全量扫描 `.vue` 未发现 `foo!.bar` 非空断言用法（UploadCard:99 在当前代码中已无该模式，line 99 为空行）。

---

## 五、硬编码值

### 5.1 硬编码颜色

| 文件 | 行号 | 问题 |
|---|---|---|
| `ColorPickerPanel.vue` | 293-311 | spectrum 渐变 `#fff`/`#000`/`#f00`...`#f0f` 字面量 |
| `HardcoreInput.vue` | 180, 191 | `fill="var(--brutal-accent, #FFE66D)"`、`fill="var(--brutal-destructive, #EF476F)"` fallback 硬编码 |
| `GlitchButton.vue` / `GlitchText.vue` | GlitchButton:213-243 / GlitchText:152-182 | `text-shadow` 中 `#EF476F`/`#4A90D9` fallback 硬编码 |
| `SketchyChart.vue` | 133-348 | 大量 `#FF6B6B`/`#4ECDC4`/`#FFE66D`/`#4A90D9`/`#7FB069`/`#EF476F`/`#000000`/`#f3f4f6` 字面量 |
| `ColorPickerPanel.vue` | 297 | `backgroundColor: hexPreview \|\| '#fff'` |

### 5.2 硬编码尺寸（Tailwind 任意值）

| 类 | 出现位置 |
|---|---|
| `text-[10px]` | `Calendar.vue:92`、`DatePickerPanel.vue:84`、`DatePickerRangePanel.vue:112`、`DateTimePickerPanel.vue:123`、`WeekPickerPanel.vue:108`、`ChatBubble variants:57`、`TimePicker.vue:113` |
| `h-[3px]` | `CommandSeparator.vue:12`、`DropdownMenuSeparator.vue:13`、`TimelineConnector.vue:19` |
| `h-[4px] w-[4px]` | `BeforeAfter.vue:68-69` |
| `w-[2px]` | `TypewriterText.vue:143` |
| `min-h-[120px]` | `KanbanBoard.vue:267` |
| `min-w-[3rem]` | `TimePicker.vue:100` |
| `min-w-[8rem]` | `ColorModeSwitcher.vue:106` |
| `max-h-[32rem]` / `max-h-[48rem]` | `virtual-scroll-variants.ts:17-18` |
| `min-w-[1.25rem]` / `min-w-[1.75rem]` / `min-w-[2.25rem]` | `kbd-variants.ts:20-22` |
| `--row-height: ${... ?? 48}px`（48 魔法数） | `DataTable.vue:187` |
| `--parallax-scale: 1.1`、`?? 300`（魔法数） | `CarouselEnhanced.vue:236-238` |

---

## 六、默认值不一致

下列组件默认值与多数组件不一致：

| 组件 | 文件 | 默认值 | 多数组件默认值 |
|---|---|---|---|
| Counter | `counter-variants.ts:27` | `size: 'md'` | `'default'` |
| Kbd | `kbd-variants.ts:27` | `size: 'md'` | `'default'` |
| TagsInputItem | `tags-input-variants.ts:21` | `variant: 'primary'` | `'default'` |
| TimelineDot | `timeline-variants.ts:24` | `variant: 'accent'` | `'default'` |
| AlertDialogAction | `AlertDialogAction.vue:16` | `variant: 'primary'` | `'default'` |
| ColorPickerHistory | `ColorPickerHistory.vue:16` | `size: 'sm'` | `'default'` |

额外 size 变体：Avatar(`xl`)、Button(`xl`/`icon`)、Carousel(`full`)、Counter(`xl`)、VirtualScroll(`xl`/`full`)、TypewriterText(`xl`/`2xl`)、GlitchButton(`xl`/`icon`)。

---

## 七、无障碍不一致

| 问题 | 位置 |
|---|---|
| `ariaLabel` prop vs 直接 `:aria-label` 混用 | ~25 个组件用 `ariaLabel` prop（Checkbox/Combobox/ColorPicker/DatePicker 系列/Input/Textarea/RadioGroup/Slider/Switch/Toggle/TagsInput/Table/TreeSelect），~30 个组件直接在模板写 `:aria-label`（Alert/Badge/Avatar/Breadcrumb/Carousel/ChatBubble/DataTable/Dialog/Toast） |
| `:disabled` 与 `:aria-disabled` 同组件混用 | `ColorPickerSwatch.vue:47-48`、`TreeViewNode.vue:170,187`、`Button.vue:58-59`、`GlitchButton.vue:179-180` 同时使用两者；`TreeSelect.vue:300` 仅用 `:aria-disabled`；`BreadcrumbPage.vue:22` 静态 `aria-disabled="true"` |
| `role="dialog"` 不一致 | `ColorPickerPanel.vue:277` + 所有 DatePicker Panel（DatePickerPanel/DatePickerRangePanel/DateTimePickerPanel/MonthPickerPanel/WeekPickerPanel/YearPickerPanel）用 `role="dialog" aria-modal="true"`，但 `Calendar.vue` 独立日历组件无此 role，同类浮层语义不统一 |
| `:aria-expanded` 缺 `:aria-controls` 配对 | `Combobox.vue:125`、`ComboboxMulti.vue:138`、`DatePicker.vue:90`、`ColorPicker.vue:94`、`TreeSelect.vue:295`、`TreeSelectNode.vue:156`、`TreeViewNode.vue:167` |

---

## 八、`<style scoped>` 不一致

9 个组件使用 `<style scoped>` 而非全局 Tailwind 模式：

- `calendar/Calendar.vue:161`
- `date-picker/DatePickerPanel.vue:179`、`DatePickerRangePanel.vue:210`、`DateTimePickerPanel.vue:227`、`WeekPickerPanel.vue:204`
- `glitch-text/GlitchText.vue:131`
- `glitch-button/GlitchButton.vue:191`
- `hardcore-input/HardcoreInput.vue:218`
- `tree-view/TreeViewNode.vue:228`
- `typewriter-text/TypewriterText.vue:161`

CSS 变量命名一致（均 `--brutal-xxx` 前缀），无 `--brutx-xxx` 或裸 `--xxx` 命名分歧；DatePicker/Calendar 共用 `--vc-*`（v-calendar 第三方变量），命名一致。

---

## 九、未国际化

下列组件存在硬编码英文文案：

| 文件 | 问题 |
|---|---|
| `SaaSPricing.vue:27-71` | `plans` 默认值大量硬编码英文：`'Starter'`/`'Pro'`/`'Enterprise'`、`'For side projects and experiments'`/`'Basic themes'`/`'Community support'`/`'Priority updates'`/`'Custom themes'`/`'All components'`/`'All themes'`/`'Priority support'`/`'Dedicated support'`、按钮 `'Get Started'`/`'Go Pro'`/`'Contact Sales'` |

其他组件（FeedbackForm/ProfilePage/SettingsPage/AuthCard/WaitlistPage）已正确走 `t()` i18n。

---

## 统计

| 类别 | 问题数 |
|---|---|
| defaultValue 双轨 + 单轨无受控 | 8 |
| emit/prop/slot/expose 命名不一致 | 8 |
| 死代码/重复实现 | 8 |
| 冗余断言 + 类型声明不一致 + CVA 副作用 | 20+ |
| 硬编码颜色/尺寸 | 15+ |
| 默认值不一致 | 6 |
| 无障碍不一致 | 4 类 |
| `<style scoped>` 不一致 | 9 个组件 |
| 未国际化 | 1 |
| **合计** | **~80** |

---

## 优先级建议

### P0 高优先级（破坏类型/受控语义/构建产物）

1. Slider/Tabs/TabsNav/ToggleGroup 双轨透传 `default*` 给 reka-ui
2. TreeSelect `filter(Boolean) as TreeNode[]` 危险断言
3. CVA `true | undefined` 陷阱（data-table/kanban/marquee/tree-view）
4. Registry `component-files.ts` 缺失 DialogEnhanced/CarouselEnhanced → CLI 无法安装

### P1 中优先级（API 一致性）

5. Pagination `update:currentPage` → `update:modelValue`
6. ErrorCard `dismiss` → `close`
7. Counter vs GlitchText 的 `start`/`play` 命名统一
8. CommandGroup `heading` → `title`，Alert slot `action` → `actions`
9. `ariaLabel` prop vs `:aria-label` 规范化（统一为一种风格）
10. 弹层组件 `open` 受控面对齐（Combobox/ColorPicker/DatePicker/TreeSelect 统一暴露或不暴露）

### P2 低优先级（清理）

11. DatePicker 系列 `mode`/`valueFormat`/`timeFormat` 死 prop
12. `as Ref` 冗余断言（Form 系列 3 处）
13. 9 处 `Props` → `XxxProps` 重命名
14. `<style scoped>` 统一化（9 个组件）
15. 硬编码颜色 fallback 提取到 CSS 变量
16. SaaSPricing plans 默认值国际化
