# 组件合并重构方案（第二期）

> 分析时间：2026-07-06
> 范围：在第一期方案（`COMPONENT_MERGE_PLAN.md`，第 1–12 项，已实施并提交于 commit f44bf35）之后新发现的合并/去重候选
> 兼容策略：**直接删除不保留 re-export**（与第一期一致）
> 核实方式：所有断言均已逐行核实源码，关键行号与文件路径见各项"现状"段

## 实施状态

| 项 | 状态 | 提交 |
|----|------|------|
| 13. Combobox + ComboboxMulti 合并 | ✅ 已完成 | `8fa95b6` |
| 14. Year/Month/WeekPicker → useDatePicker | ✅ 已完成 | `8fa95b6` |
| 15. 浮层动画类抽取 | ✅ 已完成（tooltip 因动画类格式差异未纳入，见下文） | `8fa95b6` |
| 16. Checkbox + Switch formToggleBase | ✅ 已完成 | `8fa95b6` |
| 17. HardcoreInput/NumberInput 验证态统一 | ✅ 已完成 | 本次实施 |
| 18. Badge + Kbd chip base | ✅ 已完成 | 本次实施 |

> **注：** 第 13–16 项已于 2026-07-02 在提交 `8fa95b6`（"执行组件合并方案 V2 — 六项重构"）中实施完成。第 17、18 项于本次实施完成。全部 6 项已实施完毕。

## 决策摘要

| 决策点 | 结论 | 理由 |
|--------|------|------|
| Combobox + ComboboxMulti | 合并为单组件（`multiple` prop），删除 ComboboxMulti | 两文件 script + template 约 90% 逐字相同，variants 已共享，仅 4 处实质差异 |
| Year/Month/WeekPicker | 迁移到**已存在**的 `useDatePicker` composable，不新建抽象 | DatePicker/DateTimePicker 已用该 composable，三个 Picker 仍内联 75 行重复逻辑；解法已验证，风险低 |
| 浮层动画类 | 抽取共享常量到 `lib/` | 7 行动画类在 4 个 variants 文件中逐字重复 |
| Checkbox + Switch | 抽取 `formToggleBaseVariants`（**修正第一期判断**） | 第一期"仅变体颜色可共享"判断有误，实际 base 行为类 8 行近乎逐字相同 |
| 验证态颜色统一 | HardcoreInput/NumberInput 统一到 `variant` prop 名 | 三处 prop 名不一致（`validationState` vs `variant`），token 已一致 |
| Badge + Kbd | 抽取 chip base（低优先级） | 共享 border/rounded + 4 色模式，但各自扩展差异较大 |

---

## 通用影响面处理规范

沿用第一期规范。"删除合并"类项（本期为第 13 项 Combobox）必须完整处理以下影响面：

1. **注册表** — `packages/registry/scripts/component-files.ts` 移除条目，重建 `packages/registry/registry/*.json`
2. **导出** — `packages/ui/src/index.ts` 移除组件导出、类型导出、`locale` 联合类型对应项
3. **shim** — 如存在 `packages/ui/src/<component>.ts` 独立 shim，一并删除
4. **composable** — 评估迁移到目标组件或删除（含测试文件）
5. **测试** — 删除对应 `*.test.ts`，必要时代码迁移到目标组件测试
6. **文档** — `apps/docs/components/<name>.md` + `en/` + `blocks/` + `en/blocks/` 删除或重定向
7. **侧边栏** — `apps/docs/.vitepress/config.ts` 移除链接
8. **Demo** — `apps/docs/.vitepress/theme/components/demos/<Name>Demo.vue` 删除或合并
9. **验证** — `pnpm release:check` + `pnpm --filter docs build`

"变体抽取"与"逻辑去重"类项（第 14–18 项）无注册表/导出/文档变动，仅需 typecheck + test + build。

---

## 高优先级

### 13. Combobox + ComboboxMulti → 合并（`multiple` prop）✅ 已完成

**实施结果（commit `8fa95b6`）：** 已合并为单个 `Combobox.vue`，`multiple: boolean` prop + `modelValue: string | string[] | undefined` 类型。`ComboboxMulti.vue` 已删除。`combobox-variants.ts` 的 `comboboxCheckboxVariants` 保留用于多选列表项样式。

**现状（实施前记录，已逐行核实）：**
- ~~[ComboboxMulti.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/combobox/ComboboxMulti.vue)~~（已在 `8fa95b6` 中删除，无法再核实）
- [Combobox.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/combobox/Combobox.vue) 原始 194 行，实施后扩展至约 251 行（含 `multiple` 分支）
- [combobox-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/combobox/combobox-variants.ts) 已被两者共享（`comboboxTriggerVariants`/`comboboxContentVariants`/`comboboxCheckboxVariants`），无需变动

**逐字相同的部分（约 90%）：**
- imports（仅 Multi 多引 `comboboxCheckboxVariants`）
- `internalOpen`/`open` computed（受控/非受控双模式）
- `searchQuery` ref
- `filteredOptions` 过滤逻辑
- `showCreateItem`/`createItemLabel`（creative 模式）
- `triggerClasses`/`contentClasses`/`triggerIconClasses` computed
- `watch(open)` 重置 searchQuery
- `contentId` 生成（`useId()`）
- template 结构：`PopoverRoot → PopoverTrigger → button → PopoverContent → Command → CommandInput/List/Empty/Group/Item`

**实质差异（仅 4 处）：**
1. `modelValue: string | undefined` vs `string[]`
2. `handleSelect`：单选 toggle-undefined 并关闭面板；多选 toggle-array 不关闭
3. 多选多 `displayText`/`maxDisplay`/`selectedCount` i18n 逻辑
4. 列表项样式：单选用 Check 图标透明度切换；多选用 checkbox 样式块

**方案：** 合并为单个 `Combobox.vue`，增加 `multiple: boolean` prop。`modelValue` 类型变为 `string | string[] | undefined`。内部按 `multiple` 分支处理 `handleSelect`、显示文案、列表项样式。`ComboboxMulti` 删除。

**需迁移内容：** `displayText`/`maxDisplay`/`selectedCount` i18n 逻辑、checkbox 列表项样式分支。

**影响面：**
- `packages/ui/src/components/combobox/ComboboxMulti.vue` — 删除
- `packages/ui/src/components/combobox/ComboboxMulti.test.ts`（如存在）— 删除，用例迁移到 Combobox.test.ts
- `packages/ui/src/components/combobox/Combobox.vue` — 增加 `multiple` prop + 分支逻辑
- `packages/ui/src/index.ts` — 移除 `ComboboxMulti` 导出；`ComboboxProps` 类型扩展 `multiple`
- `packages/registry/scripts/component-files.ts` — 检查是否需调整（combobox 目录保留，仅文件减少）
- `apps/docs/components/combobox.md` + `en/components/combobox.md` — 增加 `multiple` 用法示例
- `apps/docs/.vitepress/theme/components/demos/ComboboxMultiDemo.vue`（如存在）— 合并到 `ComboboxDemo.vue` 后删除

---

### 14. YearPicker + MonthPicker + WeekPicker → 迁移到 `useDatePicker` composable ✅ 已完成

**实施结果（commit `8fa95b6`）：** 三个 Picker 均已改用 `useDatePicker` composable，script 从约 75 行缩减至约 30 行。`DateTimePicker` 也一并对齐。`useDatePicker` 签名已覆盖三个 Picker 的全部 emit（`open`/`close`/`change`/`update:modelValue`/`update:open`）与 `displayFormat` 动态值场景（getter 形式）。前置确认已完成，无需扩展 composable。

**现状（已逐行核实，关键发现）：**
- [DatePicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/DatePicker.vue) 与 [DateTimePicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/DateTimePicker.vue) **已经使用** `useDatePicker` composable（`@/composables/useDatePicker`），script 仅约 30 行
- [YearPicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/YearPicker.vue)、[MonthPicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/MonthPicker.vue)、[WeekPicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/WeekPicker.vue) **未使用该 composable**，各自内联重复逻辑
- **YearPicker 与 MonthPicker 的 script 第 50–125 行（75 行）逐字相同**
- [TimePicker.vue](file:///e:/project/brutxui-vue3/packages/ui/src/components/date-picker/TimePicker.vue) **架构完全不同**（用 `SelectRoot`/`SelectTrigger` 渲染时/分/秒三下拉，非 Popover shell），**不纳入此项**

**三个 Picker 内联的重复逻辑（已在 composable 中实现）：**
- `internalOpen` ref + `displayValue` ref
- `watch(internalOpen)` 的 open/close/change emit 三连
- `watch(modelValue)` 同步 displayValue
- `watch(open)` 受控同步
- `open` computed（受控/非受控双模式）
- `formattedDisplay` computed
- `handlePanelUpdate`/`handlePanelConfirm`/`handlePanelClear`
- `handleClearClick`/`handleTriggerKeydown`

**方案：** YearPicker/MonthPicker/WeekPicker 改为调用 `useDatePicker` composable，与 DatePicker/DateTimePicker 对齐。无需新建抽象——composable 已存在且被两个组件验证。

**需迁移内容：** 三个 Picker 各自约 75 行 script 逻辑替换为 composable 调用（约 15 行）。各 Picker 保留自己的 `resolvedPlaceholder`/`resolvedAriaLabel`（i18n key 不同）、`displayFormat` 默认值、WeekPicker 额外的 `weekStartsOn`/`shortcuts` props 透传。

**前置确认：** 迁移前需核查 `useDatePicker` 的签名是否覆盖三个 Picker 的全部 emit（`open`/`close`/`change`/`update:modelValue`/`update:open`）与 `displayFormat` 动态值场景（DateTimePicker 用了 computed，说明支持 getter）。若发现缺口，先扩展 composable。

**影响面（小）：**
- `packages/ui/src/components/date-picker/YearPicker.vue` — 改用 composable
- `packages/ui/src/components/date-picker/MonthPicker.vue` — 改用 composable
- `packages/ui/src/components/date-picker/WeekPicker.vue` — 改用 composable
- `packages/ui/src/composables/useDatePicker.ts` — 必要时扩展（如支持 `weekStartsOn`）
- `packages/ui/src/composables/useDatePicker.test.ts`（如存在）— 补充用例
- 组件保留，无注册表/导出/文档变动

---

### 15. 浮层进入/退出动画类 → 抽取共享常量 ✅ 已完成

**实施结果（commit `8fa95b6`）：** 新增 [floating-animation-classes.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/floating-animation-classes.ts)，导出 `floatingContentAnimationClasses` 常量。`popover-variants.ts`、`select-variants.ts`、`dropdown-menu-variants.ts` 已改为引用共享常量。

**⚠️ tooltip 未纳入（修正原分析）：** 原文档断言 [tooltip-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/tooltip/tooltip-variants.ts#L8-L13) 第 8–13 行的动画类与其它 3 个文件"完全相同"。**此断言有误。** tooltip-variants.ts 第 8 行使用 `animate-in fade-in-0 zoom-in-95`（无 `data-[state=open]` 前缀），而共享常量使用 `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`。tooltip 的 open 态动画格式不同（可能因 reka-ui Tooltip 的挂载时机差异），故未迁移到共享常量。若后续需统一，需先验证 tooltip 的动画行为是否兼容 `data-[state=open]` 前缀写法。

**现状（已逐字核实）：** 以下 7 行动画类在 4 个 variants 文件中**完全相同**：

```
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[side=top]:slide-in-from-bottom-2
```

出现位置：
- [popover-variants.ts:8-14](file:///e:/project/brutxui-vue3/packages/ui/src/components/popover/popover-variants.ts#L8-L14)
- [tooltip-variants.ts:8-13](file:///e:/project/brutxui-vue3/packages/ui/src/components/tooltip/tooltip-variants.ts#L8-L13)
- [select-variants.ts:40-46](file:///e:/project/brutxui-vue3/packages/ui/src/components/select/select-variants.ts#L40-L46)
- [dropdown-menu-variants.ts:6-12](file:///e:/project/brutxui-vue3/packages/ui/src/components/dropdown-menu/dropdown-menu-variants.ts#L6-L12)（`dropdownMenuContentVariants` 与 `dropdownMenuSubContentVariants` 共用）

**方案：** 新增 `packages/ui/src/lib/floating-content-variants.ts`，导出 `floatingContentAnimationClasses` 常量（字符串数组）。四个 variants 文件引用。

**影响面（小）：**
- 新增 `packages/ui/src/lib/floating-content-variants.ts`
- 四个 variants 文件改为引用共享常量
- 无注册表/导出/文档/测试变动

---

## 中优先级

### 16. Checkbox + Switch → 抽取 `formToggleBaseVariants`（修正第一期判断）✅ 已完成

**实施结果（commit `8fa95b6`）：** 新增 [form-toggle-base.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/form-toggle-base.ts)，导出 `formToggleBaseClasses`（base 行为类）与 `formToggleVariantColors`（变体着色映射）。

**⚠️ 文件名与导出名修正：** 原方案提议文件名 `form-toggle-variants.ts`、导出 `formToggleBaseVariants` + `formToggleVariantKeys`。实际实施为文件名 `form-toggle-base.ts`、导出 `formToggleBaseClasses` + `formToggleVariantColors`。`formToggleBaseClasses` 复用了 `@/lib/brutal-interaction-variants` 的 `brutalHoverLift`/`brutalPress`（而非原文档表格中的 `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`）。

**现状（已逐行核实）：** 第一期方案"低优先级 — 暂不合并"表中 Checkbox + Switch 一行注明"仅变体颜色可共享"。**此判断有误。**

[checkbox-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/checkbox/checkbox-variants.ts) 与 [switch-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/switch/switch-variants.ts) 的 base 行为类**近乎逐字相同**（8 行）：

| 类 | checkbox | switch |
|----|----------|--------|
| 边框 | `border-3 border-brutal` | `border-3 border-brutal` |
| 过渡 | `transition-all duration-150` | `transition-all duration-150` |
| 阴影 | `shadow-brutal-sm` | `border-3 border-brutal rounded-brutal shadow-brutal-sm`（switch 多 `rounded-brutal`） |
| hover | `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5` | 相同 |
| active | `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none` | 相同 |
| focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2` | 相同 |
| disabled | `disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none` | 相同 |

variant 键集相同：`default/primary/secondary/accent/danger`。size 键集相同：`sm/default/lg`（值不同：checkbox 方形，switch 长方形）。

**方案：** 抽取 `packages/ui/src/components/lib/form-toggle-variants.ts`（或 `packages/ui/src/lib/form-toggle-variants.ts`），导出 `formToggleBaseVariants`（base 行为类）与 `formToggleVariantKeys`（variant 键集常量）。各组件保留自己的 size 值、checked/unchecked 着色差异、checkbox 的 `flex items-center justify-center`、switch 的 `rounded-brutal` + thumb 逻辑。

**影响面（小）：**
- 新增共享 variants 文件
- `checkbox-variants.ts`/`switch-variants.ts` 改为引用共享 base
- 无注册表/导出/文档变动
- **同步修正**第一期方案"低优先级 — 暂不合并"表，将 Checkbox + Switch 一行移出

---

### 17. Input / HardcoreInput / NumberInput → 验证态颜色统一 ✅ 已完成

**现状（已核实，修正 Explore 报告中的 token 误差）：**
- [shared-input-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/input/shared-input-variants.ts)（第一期已建）：`inputVariantClasses`，prop 名 `variant`
- [hardcore-input-variants.ts:17-22](file:///e:/project/brutxui-vue3/packages/ui/src/components/hardcore-input/hardcore-input-variants.ts#L17-L22)：prop 名 `validationState`，键 `default/success/error`，token `border-brutal-destructive`
- [number-input-variants.ts:16-19](file:///e:/project/brutxui-vue3/packages/ui/src/components/number-input/number-input-variants.ts#L16-L19)：prop 名 `variant`，键 `default/error/success`，token `border-brutal-destructive`

**核实结论：** token 已一致（三处均用 `border-brutal-destructive`，Explore 报告称 number-input 用 `border-brutal-danger` 有误）。**实际不一致点为 prop 名**：hardcore-input 用 `validationState`，其余用 `variant`；以及键顺序。

**方案：** HardcoreInput 改用 `variant` prop 名（破坏性变更，需文档同步），三个组件统一引用 `inputVariantClasses`（或各自的等价定义引用同一常量）。NumberInput 的 `focus-within:ring-*` 联动需保留（其是 root 容器而非 input 本身）。

**⚠️ 技术障碍（核实补充）：** 直接让三组件统一引用 `inputVariantClasses` 存在不兼容：
- [shared-input-variants.ts:7-8](file:///e:/project/brutxui-vue3/packages/ui/src/components/input/shared-input-variants.ts#L7-L8) 使用 `focus:` 前缀（针对 input 元素本身的焦点态）
- [number-input-variants.ts:8](file:///e:/project/brutxui-vue3/packages/ui/src/components/number-input/number-input-variants.ts#L8) 使用 `focus-within:` 前缀（针对 root 容器的子元素焦点态）

共享常量若直接包含 `focus:*` 类，会破坏 NumberInput 的焦点联动；若包含 `focus-within:*` 类，对 HardcoreInput 又多余。建议方案：共享常量仅抽取 border 颜色（`border-brutal`/`border-brutal-destructive`/`border-brutal-success`），各组件自行添加 focus 联动类；或为 `inputVariantClasses` 增加 `focusMode: 'self' | 'within'` 选项参数。

**实施结果：** 采用上述建议方案一（共享常量仅抽取 border 颜色）：
- [shared-input-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/input/shared-input-variants.ts) 新增 `validationBorderColors` 常量（仅 `border-brutal`/`border-brutal-destructive`/`border-brutal-success`），`inputVariantClasses` 内部复用它并追加 Input 专有的 `focus:shadow-*` 类
- [hardcore-input-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/hardcore-input/hardcore-input-variants.ts) CVA key 从 `validationState` 重命名为 `variant`，引用 `validationBorderColors`
- [HardcoreInput.vue:144](file:///e:/project/brutxui-vue3/packages/ui/src/components/hardcore-input/HardcoreInput.vue#L144) 调用点改为 `hardcoreInputVariants({ variant: validationState.value })`
- [number-input-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/number-input/number-input-variants.ts) error/success 引用 `validationBorderColors`，保留 `focus-within:ring-*` 联动

**⚠️ 修正原方案判断：** 原方案称"HardcoreInput 改用 `variant` prop 名（破坏性变更）"。**此判断有误。** HardcoreInput 的 `validationState` 是 `useFormFieldValidation` composable 返回的内部 ref，**并非 prop**。CVA key 重命名为 `variant` 是纯内部变更，无用户可感知的 API 变动，无需文档同步。

**影响面（中）：**
- `hardcore-input-variants.ts` — prop 名 `validationState` → `variant`，改用共享 `inputVariantClasses`
- `HardcoreInput.vue` — props/模板中 `validationState` 引用改为 `variant`
- `number-input-variants.ts` — 改用共享 `inputVariantClasses`（保留 `focus-within` 联动）
- `apps/docs/components/hardcore-input.md` + `en/` — prop 名同步更新
- HardcoreInput 测试 — 更新 prop 名

---

## 低优先级

### 18. Badge + Kbd → 抽取 chip base ✅ 已完成

**实施结果：** 新增 [chip-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/lib/chip-variants.ts)，导出 `chipBaseClasses`（`inline-flex items-center` + `border-3 border-brutal` + `rounded-brutal`）与 `chipColorVariants`（primary/secondary/accent 3 色 `bg-brutal-{X} text-brutal-{X}-foreground` 映射）。

**⚠️ 修正原方案：** 原方案称共享"4 色模式"。**实际仅 3 色可共享**（primary/secondary/accent）。`default` 色不一致：Badge 用 `bg-brutal-bg text-brutal-fg`，Kbd 用 `bg-brutal-muted text-brutal-fg`，各组件保留自己的 `default` 定义。此外 `shadow-brutal-sm` 放置位置不同：Badge 在颜色变体中（因 `outline` 无 shadow），Kbd 在 base 中。

- [badge-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/badge/badge-variants.ts) — 引用 `chipBaseClasses` + `chipColorVariants`（追加 `shadow-brutal-sm`），保留 `default`/`danger`/`success`/`outline`
- [kbd-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/kbd/kbd-variants.ts) — 引用 `chipBaseClasses`（追加 `justify-center`）+ `chipColorVariants`，保留 `default` 色；同步移除多余分号以与项目代码风格一致

**现状（已核实）：**
- [badge-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/badge/badge-variants.ts) 与 [kbd-variants.ts](file:///e:/project/brutxui-vue3/packages/ui/src/components/kbd/kbd-variants.ts)
- 共享：`inline-flex items-center` + `border-3 border-brutal rounded-brutal` + 4 色模式（`default/primary/secondary/accent`，`bg-brutal-{X} text-brutal-{X}-foreground`）
- 差异：Badge 多 `font-bold tracking-wide transition-colors shadow-brutal-sm` + `danger/success/outline` 变体；Kbd 多 `justify-center font-mono font-black shadow-brutal-sm select-none whitespace-nowrap` + size 含 `min-w`

**方案：** 抽取 `packages/ui/src/lib/chip-variants.ts`，导出 `chipBaseVariants`（`inline-flex items-center border-3 border-brutal rounded-brutal`）与 `chipColorVariants`（4 色映射）。两者各自扩展。

**影响面（小）：**
- 新增 `packages/ui/src/lib/chip-variants.ts`
- `badge-variants.ts`/`kbd-variants.ts` 改为引用
- 无注册表/导出/文档变动
- 收益有限，可延后

---

## 已核实第一期判断正确的部分

为避免重复评估，以下第一期"不动"判断已重新核实，确认正确：

- **Spinner 家族（4 种）**：`Spinner.vue`（border-ring）/ `BlockSpinner.vue`（2x2 grid）/ `BarsSpinner.vue`（vertical bars）/ `DotsSpinner.vue`（dot row），DOM 结构不同，已共享 `SPINNER_COLOR_CLASSES`。保持独立合理。
- **Select + Combobox + TreeSelect 底层原语不同**：Combobox 用 `PopoverRoot`，Select 用 reka-ui `Select` 原语族，TreeSelect 用 `PopoverRoot` + 自建 Node。确认不同。（注：第 13 项合并的是 Combobox 内部的单选/多选，不涉及与 Select/TreeSelect 的合并。）
- **Card 家族无薄包装**：AuthCard/BlogCard/ErrorCard/FileCard/SuccessCard/TestimonialCard 各有独立内容布局，无合并价值。Card3D 独立变体机制（`--card3d-offset`），收益低。

---

## 执行顺序

### 已完成（commit `8fa95b6`，2026-07-02）

1. ✅ **Combobox + ComboboxMulti** — 合并为 `multiple` prop，删除 ComboboxMulti
2. ✅ **Year/Month/WeekPicker → useDatePicker** — 迁移到已存在 composable
3. ✅ **浮层动画类** — 抽取 `floating-animation-classes.ts`（tooltip 因动画类格式差异未纳入）
4. ✅ **Checkbox + Switch** — 抽取 `form-toggle-base.ts`（`formToggleBaseClasses` + `formToggleVariantColors`）

### 附加工作（commit `8fa95b6` 中一并完成，未在原方案中记录）

5. ✅ **`brutal-danger` → `brutal-destructive` 全局 token 统一** — 影响 alert-dialog/dialog/dropdown-menu/popover/select/switch/checkbox 等多个 variants 文件
6. ✅ **`tree-variants.ts` 新增 `BASE_INDENT` 命名常量** — 消除魔法数字，符合项目"禁止魔法数字"约定

### 本次实施

7. ✅ **HardcoreInput/NumberInput 验证态统一** — 抽取 `validationBorderColors` 共享常量（仅 border 颜色），HardcoreInput CVA key `validationState` → `variant`（内部变更，非破坏性），NumberInput 保留 `focus-within:` 联动
8. ✅ **Badge + Kbd** — 抽取 `chip-variants.ts`（`chipBaseClasses` + `chipColorVariants` 3 色共享），各组件保留自己的 `default` 色与扩展差异

**全部 6 项已实施完毕。**

---

## 验证

### 已完成项的验证（commit `8fa95b6`，已通过）

第 13–16 项及附加工作已在提交时通过 `pnpm release:check` + `pnpm --filter docs build` 验证：
- `packages/registry/registry/*.json` 已重建且不含 ComboboxMulti
- `apps/docs/.vitepress/config.ts` 侧边栏无失效链接
- `apps/docs/.vitepress/theme/components/demos/` 下无残留对 ComboboxMulti 的 import
- 三个 Picker 迁移后事件时序与 DatePicker 一致

### 待执行项的验证

每项完成后运行：

```bash
pnpm release:check          # 完整门禁：lint + typecheck + test + build + registry 校验
pnpm --filter docs build    # 文档站点构建验证
```

**第 17 项验证（已通过）：**
- ✅ `pnpm release:check` 全部门禁通过（lint + typecheck + 3377 tests + build + registry）
- ✅ `pnpm --filter docs build` 文档站点构建通过
- ✅ NumberInput 的 `focus-within:` 焦点联动未被共享常量破坏（保留独立 focus-within 类）
- ✅ HardcoreInput CVA key 重命名为 `variant` 是内部变更，无 prop API 变动，文档无需更新

**第 18 项验证（已通过）：**
- ✅ `pnpm release:check` 全部门禁通过（lint + typecheck + 3377 tests + build + registry）
- ✅ `pnpm --filter docs build` 文档站点构建通过
- ✅ 视觉回归：Badge/Kbd 的 base 类与颜色变体均引用共享常量，输出类字符串与抽取前一致（零视觉差异）

---

## 与第一期方案的关系

- 本期不重复第一期已实施的 1–12 项
- 第 16 项修正第一期"低优先级 — 暂不合并"表中 Checkbox + Switch 的错误判断（已实施完成）
- 第 14 项发现 `useDatePicker` composable 已存在并被 DatePicker/DateTimePicker 使用，三个 Picker 迁移即可，无需新建抽象（已实施完成）
- 第 15 项修正：tooltip-variants.ts 的动画类与其它 3 个文件**并非完全相同**（open 态无 `data-[state=open]` 前缀），故未纳入共享常量
- 兼容策略、影响面处理规范、验证命令均沿用第一期

---

## 文档维护说明

- 2026-07-06：初始分析，规划第 13–18 项
- 2026-07-06：审查后更新——标注第 13–16 项已于 commit `8fa95b6`（2026-07-02）完成；修正第 15 项 tooltip 断言；补充第 17 项 `focus:` vs `focus-within:` 技术障碍；修正第 16 项文件名与导出名；补充 commit `8fa95b6` 的附加工作（token 统一 + BASE_INDENT）；当前仅第 17、18 项待执行
- 2026-07-06：实施第 17 项——抽取 `validationBorderColors` 共享常量（仅 border 颜色），HardcoreInput CVA key 重命名为 `variant`（内部变更非破坏性），NumberInput 保留 `focus-within:` 联动；通过 `pnpm release:check` + `pnpm --filter docs build` 验证；修正原方案"破坏性变更"误判；当前仅第 18 项待执行
- 2026-07-06：实施第 18 项——抽取 `chip-variants.ts`（`chipBaseClasses` + `chipColorVariants` 3 色共享）；修正原方案"4 色共享"为 3 色（`default` 色不一致）；通过 `pnpm release:check` + `pnpm --filter docs build` 验证；全部 6 项实施完毕
