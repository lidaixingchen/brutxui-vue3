# 组件合并重构方案

> 分析时间：2026-07-02（修订版，已核实源码并修正事实性偏差）
> 范围：`packages/ui/src/components/` 全量组件
> 兼容策略：**直接删除不保留 re-export**（与"清除兼容包袱"工作方向一致）

## 决策摘要

| 决策点 | 结论 | 理由 |
|--------|------|------|
| 向后兼容 | 直接删除，不保留 re-export、类型别名、locale 联合类型项 | 与近期"清除兼容包袱"方向一致，强制使用者迁移 |
| 职责过载项 | StepperSection、CarouselEnhanced 保留独立组件，仅抽取共享变体/类名 | 合并会导致基础组件 props 膨胀、条件分支激增；这类组件是语义层封装而非薄包装，参考 Popconfirm 模式 |
| TreeView/TreeSelect | 仅共享变体定义，Node 组件保持独立 | 两者键盘导航实现策略截然不同（emit 事件调度 vs Node 内 DOM 查询），共享 TreeNode 抽象成本高、收益低 |

---

## 通用影响面处理规范（适用于"删除合并"类项）

每个删除合并项必须处理以下影响面，缺一不可：

1. **注册表** — `packages/registry/scripts/component-files.ts` 移除条目（含 `composables` 引用），随后重建 `packages/registry/registry/*.json`
2. **导出** — `packages/ui/src/index.ts` 移除组件导出、类型导出、`locale` 联合类型中的对应项
3. **shim** — 如存在 `packages/ui/src/<component>.ts` 形式的独立 shim，一并删除
4. **composable** — 如组件有专属 composable，评估迁移到目标组件或删除（含其测试文件）
5. **测试** — 删除对应 `*.test.ts`，必要时代码迁移到目标组件测试
6. **文档** — `apps/docs/components/<name>.md` + `en/components/<name>.md` + `blocks/<name>.md` + `en/blocks/<name>.md` 删除或重定向到目标组件
7. **侧边栏** — `apps/docs/.vitepress/config.ts` 移除对应链接
8. **Demo** — `apps/docs/.vitepress/theme/components/demos/<Name>Demo.vue` 删除或合并到目标组件 Demo
9. **验证** — `pnpm release:check`（完整门禁：lint + typecheck + test + build + registry 校验）+ `pnpm --filter docs build`

---

## 高优先级 — 删除合并

### 1. SubmitButton → Button

**现状（已核实）：** 47 行。`<Button type="submit">` + loading 时显示 pendingText。仅 `resolvedPendingText` 一个 computed（i18n 回退）。断言准确。

**方案：** Button 增加 `pendingText` prop，当 `type="submit" && loading` 时自动显示。SubmitButton 删除。

**需迁移内容：** `resolvedPendingText` 的 i18n 回退逻辑（`useLocale` + `submitButtonLocale` 默认值）合并到 Button，或由 Button 直接消费 `SubmitButtonLocale`（合并到 Button 的 locale 命名空间）。

**影响面：**
- `packages/ui/src/components/submit-button/SubmitButton.vue` — 删除
- `packages/ui/src/components/submit-button/*.test.ts` — 删除
- `packages/ui/src/submit-button.ts` — 删除独立 shim
- `packages/ui/src/index.ts` — 移除 `SubmitButton` 导出与 `SubmitButtonLocale` locale 联合类型项
- `packages/registry/scripts/component-files.ts` — 移除 `submit-button` 条目
- `packages/ui/src/components/button/Button.vue` — 增加 `pendingText` prop + i18n 逻辑
- `packages/ui/src/locales/*/submit-button.ts` — 合并到 button locale（或保留文件由 Button 引用）
- `apps/docs/components/submit-button.md` + `en/components/submit-button.md` — 删除，内容合并到 `button.md`
- `apps/docs/.vitepress/config.ts` — 移除侧边栏链接
- `apps/docs/.vitepress/theme/components/demos/SubmitButtonDemo.vue` — 合并到 `ButtonDemo.vue` 后删除

---

### 2. SaaSPricing → PricingSection

**现状（已核实，修正）：** 94 行。template 是薄包装，将默认 plan 数据传给 PricingSection。**但 script 非空**，含 3 个 computed：
- `resolvedTitle` — i18n 回退标题
- `defaultPlans` — 内联 SaaS 三档默认数据 + i18n
- `normalizedPlans` — 合并用户 plans 与默认

另有 `useLocale()` 调用、`plan-select` emit、独立 `PricingPlan`/`PricingFeature` 类型。

**方案：** PricingSection 增加 `preset` prop（如 `preset="saas"`），内置默认数据。SaaSPricing 的 3 个 computed 与默认数据迁移到 PricingSection 的 preset 实现中。SaaSPricing 删除。

**需迁移内容：** 3 个 computed 逻辑、SaaS 三档默认数据、`plan-select` emit、`PricingPlan`/`PricingFeature` 类型（迁移到 pricing-section 类型文件）。

**影响面：**
- `packages/ui/src/components/saas-pricing/SaaSPricing.vue` — 删除
- `packages/ui/src/components/saas-pricing/*.test.ts` — 删除
- `packages/ui/src/components/saas-pricing/types.ts` — 类型迁移到 `pricing-section/types.ts` 后删除
- `packages/ui/src/index.ts` — 移除 `SaaSPricing` 导出、`PricingPlan`/`PricingFeature` 类型导出改为从 pricing-section 导出、`SaaSPricingLocale` locale 联合类型项移除（合并到 PricingSection locale）
- `packages/registry/scripts/component-files.ts` — 移除 `saas-pricing` 条目
- `packages/ui/src/components/pricing-section/PricingSection.vue` — 增加 `preset` prop + 迁移逻辑
- `apps/docs/components/saas-pricing.md` + `en/components/saas-pricing.md` + `blocks/saas-pricing.md` + `en/blocks/saas-pricing.md` — 删除，内容合并到 `pricing-section.md`
- `apps/docs/.vitepress/config.ts` — 移除侧边栏链接
- `apps/docs/.vitepress/theme/components/demos/SaaSPricingDemo.vue` — 合并到 `PricingSectionDemo.vue` 后删除

---

### 3. TabsNav → Tabs

**现状（已核实，修正）：** 86 行。接收 `tabs` 数组，遍历渲染 TabsList/TabsTrigger/TabsContent，附 EmptyState fallback。**另有受控/非受控双模式状态管理未在原方案提及：**
- `internalValue` ref
- `activeValue` computed（含"回退到首个 tab"逻辑）
- `handleUpdateModelValue` 方法
- `header`/`footer`/默认 slot

**方案：** Tabs 增加可选 `tabs` prop，传入时自动渲染子组件（含上述状态管理与 EmptyState fallback），未传入时保持原有 slot 用法。TabsNav 删除。

**需迁移内容：** `internalValue`/`activeValue`/`handleUpdateModelValue` 状态管理、EmptyState fallback、`header`/`footer`/默认 slot、`TabItem` 类型。

**影响面：**
- `packages/ui/src/components/tabs-nav/TabsNav.vue` — 删除
- `packages/ui/src/components/tabs-nav/*.test.ts` — 删除
- `packages/ui/src/components/tabs-nav/types.ts` — `TabItem` 类型迁移到 tabs 类型后删除
- `packages/ui/src/index.ts` — 移除 `TabsNav` 导出、`TabItem` 类型改为从 tabs 导出、`TabsNavLocale` locale 联合类型项移除
- `packages/registry/scripts/component-files.ts` — 移除 `tabs-nav` 条目
- `packages/ui/src/components/tabs/Tabs.vue` — 增加 `tabs` prop 分支 + 迁移状态管理
- `apps/docs/blocks/tabs-nav.md` + `en/blocks/tabs-nav.md` — 删除，内容合并到 `tabs.md`
- `apps/docs/.vitepress/config.ts` — 移除侧边栏链接
- `apps/docs/.vitepress/theme/components/demos/TabsNavDemo.vue` — 合并到 `TabsDemo.vue` 后删除

---

## 中优先级 — 抽取共享变体/逻辑（组件保留，无删除）

### 4. StepperSection + Stepper — 共享变体

**现状（已核实，修正）：** StepperSection 133 行（**非原方案描述的"仅两个 computed"**）。实际含 10 个 computed（`resolvedTitle`/`resolvedPrevious`/`resolvedNext`/`stepperSteps`/`activeStep`/`canGoPrevious`/`canGoNext`/`rootClasses`/`previousIconClasses`/`nextIconClasses`）+ 3 个方法（`handleStepClick`/`handlePrevious`/`handleNext`）+ i18n + Card 包装 + EmptyState + 3 个 slot。

**方案（修正）：** **保留 StepperSection 独立组件**，不合并进 Stepper。抽取 `packages/ui/src/components/stepper/stepper-variants.ts`，导出共享的步骤项变体（active/inactive/completed 状态类）和导航按钮变体。StepperSection 与 Stepper 各自引用。

**影响面（小）：**
- 新增 `packages/ui/src/components/stepper/stepper-variants.ts`
- `packages/ui/src/components/stepper/Stepper.vue` — 改用共享变体
- `packages/ui/src/components/stepper-section/StepperSection.vue` — 改用共享变体
- 无注册表/导出/文档/测试变动

---

### 5. Carousel + CarouselEnhanced — 共享类名常量

**现状（已核实，修正）：** Carousel 124 行，Enhanced 231 行。以下类名**逐字相同**：
- `dotActiveClasses` / `dotInactiveClasses`
- `prevButtonClass` / `nextButtonClass`（均用 `carouselButtonVariants({ direction })`）
- `rootClass`（均用 `carouselRootVariants({ size })`）
- 箭头按钮模板（ChevronLeft/Right `w-5 h-5` + aria-label）

**Enhanced 额外功能（不止原方案所述三项）：**
- 缩略图（thumbnails，含 position/size/gap/highlightCurrent 配置 + slot）
- 自动播放指示器：**3 种类型**（progress/fraction/dots），非仅"进度条"
- 视差（parallax，含 scale/duration/easing）
- 条件性 pause-on-hover（基于 `autoplayIndicator?.pauseOnHover`）
- thumbnails 显示时隐藏 dots 的联动逻辑
- 不同 composable：`useCarouselEnhanced`（多 `autoplayProgress`）vs `useCarousel`
- 不同默认常量来源：`DEFAULT_AUTOPLAY_INTERVAL_MS` vs `DEFAULT_AUTOPLAY_DELAY`
- 额外 expose `startAutoplay`/`stopAutoplay`

**方案（修正）：** **保留 CarouselEnhanced 独立组件**，不合并进 Carousel。抽取共享类名常量到 `packages/ui/src/components/carousel/carousel-shared.ts`（或扩展现有 `carousel-variants.ts`），导出 `dotActiveClasses`/`dotInactiveClasses`/箭头按钮模板组件。两个组件各自引用。

**影响面（小）：**
- 新增或扩展 `packages/ui/src/components/carousel/carousel-shared.ts`
- `packages/ui/src/components/carousel/Carousel.vue` — 改用共享常量
- `packages/ui/src/components/carousel/CarouselEnhanced.vue` — 改用共享常量
- `useCarouselEnhanced` composable 及其测试 — **保留不动**
- 无注册表/导出/文档/测试变动

---

### 6. TreeView + TreeSelect — 共享变体

**现状（已核实，修正）：** "几乎一致"**严重高估**。
- `INDENT_PER_DEPTH = 20` 相同 ✓，但 `BASE_INDENT` 不同（TreeView=4，TreeSelect=8）
- 键盘导航键列表相同（Space/Enter/ArrowRight/Left/Up/Down/Home/End），但**实现策略截然不同**：TreeView 通过 emit 事件（`focus-prev/next/parent/first-child/first/last`）让父组件调度；TreeSelect 在 Node 内部直接 DOM 查询（`focusAdjacent`/`focusParent`/`focusFirstChild`/`getVisibleTreeItems`）。ArrowRight 行为也不同（TreeView 同时 toggle+select，TreeSelect 仅 toggle）
- 变体差异：hover 行 `shadow-brutal-lg` vs `shadow-brutal`，TreeSelect 额外 6 个 `disabled:*` 类
- Props（selectionMode/checkedIds/isFirstRoot vs selectedIds/multiple/focusedId）、emits（7 vs 3）、图标（File/Folder/Checkbox vs Check/Folder）、Transition（有 vs 无）、tabindex 逻辑、icon 尺寸（硬编码 vs iconSizeVariants）均不同

**方案（修正）：** **Node 组件保持独立**。抽取 `packages/ui/src/components/tree/tree-variants.ts`，导出共享的 `INDENT_PER_DEPTH` 常量与节点基础类（chevron、label 等公共部分）。各 Node 组件保留自己的 disabled/selected 等差异变体。

**影响面（小）：**
- 新增 `packages/ui/src/components/tree/tree-variants.ts`
- `packages/ui/src/components/tree-view/TreeViewNode.vue` — 引用共享常量
- `packages/ui/src/components/tree-select/TreeSelectNode.vue` — 引用共享常量
- 无注册表/导出/文档/测试变动

---

### 7. Button + GlitchButton — 变体抽取

**现状（已核实，修正）：** **9 个 variant**（default/primary/secondary/accent/danger/success/outline/ghost/link，原方案写"8 个"有误）+ 5 个 size（sm/default/lg/xl/icon）。variant 与 size 块逐字相同 ✓。但 base 类**并非完全相同**：GlitchButton 多 `glitch-button`/`relative`，缺 `rounded-brutal`。GlitchButton 额外有 `speed`/`direction` 变体与 `trigger`/`interval` props。

**方案：** 抽取 `packages/ui/src/components/button/shared-button-variants.ts`，导出 `baseButtonVariants`、`buttonVariantOptions`、`buttonSizeOptions`。GlitchButton 在此基础上扩展 `speed`/`direction`，并补充自己的 base 类差异。

**影响面（小）：**
- 新增 `packages/ui/src/components/button/shared-button-variants.ts`
- `packages/ui/src/components/button/button-variants.ts` — 改为从 shared 引用
- `packages/ui/src/components/glitch-button/glitch-button-variants.ts` — 改为从 shared 引用 + 扩展
- 无注册表/导出/文档/测试变动

---

### 8. Input + Textarea — 共享类型与变体

**现状（已核实，修正）：**
- variant（default/error/success）相同 ✓
- size 键相同（sm/default/lg），**但值不同**：Input 含固定高度 `h-9`/`h-11`/`h-14`，Textarea 无（多行）；py 值不同（如 sm：Input `py-1` vs Textarea `py-2`）。"完全重叠"不准确
- props 5 项重叠（modelValue/disabled/readonly/placeholder/errorMessage）✓，但**漏报 Input 独有 7 项**：type/maxlength/clearable/showPassword/showWordLimit/prefixIcon/suffixIcon + prepend/append slots + 密码切换 + 字数统计 + useClearable
- 暴露方法 focus/blur/select 相同 ✓

**方案：** 抽取 `packages/ui/src/components/input/shared-input-variants.ts`，导出共享的 variant 定义和 prop 类型接口 `BaseInputProps`。**size 各自维护**（值不同，不强行统一）。

**影响面（小）：**
- 新增 `packages/ui/src/components/input/shared-input-variants.ts`
- `packages/ui/src/components/input/input-variants.ts` — 改为从 shared 引用 variant
- `packages/ui/src/components/textarea/textarea-variants.ts` — 改为从 shared 引用 variant
- 无注册表/导出/文档/测试变动

---

### 9. Dialog + AlertDialog + Sheet — 共享模态变体

**现状（已核实）：** 三者共享 `bg-brutal-bg`、`border-3 border-brutal`、`shadow-brutal-xl`、`rounded-brutal`、动画 data 属性。Sheet 内部已使用 Dialog 原语。`packages/ui/src/lib/modal-variants.ts` **已存在**（导出 `overlayVariants`/`sectionHeaderVariants`/`sectionFooterVariants`/`CLOSE_BUTTON_BASE_CLASSES`），未导出 `baseModalContentClasses`。

**方案：** 扩展 `packages/ui/src/lib/modal-variants.ts`，导出 `baseModalContentClasses` 常量，三个组件各自引用。

**影响面（小）：**
- `packages/ui/src/lib/modal-variants.ts` — 新增导出
- `packages/ui/src/components/dialog/dialog-variants.ts` — 改用共享常量
- `packages/ui/src/components/alert-dialog/alert-dialog-variants.ts` — 改用共享常量
- `packages/ui/src/components/sheet/sheet-variants.ts` — 改用共享常量
- 无注册表/导出/文档/测试变动

---

### 10. Upload + UploadCard — 逻辑去重

**现状（已核实）：** 两者各自实现文件大小校验（`validateFileSize` vs `filterBySize`）、文件选择、accept 过滤。UploadCard **未使用 Upload**，完全独立（仅引 Card/Button/Progress/Spinner）。

**方案：** 从 Upload 抽取 `packages/ui/src/composables/useUpload.ts`（含文件校验、选择、accept 过滤逻辑），Upload 改用该 composable，UploadCard 改用该 composable 替代自身重复实现。

**影响面（中）：**
- 新增 `packages/ui/src/composables/useUpload.ts` + `useUpload.test.ts`
- `packages/ui/src/components/upload/Upload.vue` — 改用 composable
- `packages/ui/src/components/upload-card/UploadCard.vue` — 改用 composable
- `packages/ui/src/composables/index.ts` — 导出新 composable
- 组件保留，无注册表/导出/文档变动

---

## 评估成本 — 暂不执行

### 11. DataTable + DataTableSection — 统一底层

**现状（已核实）：** 两者都实现搜索、排序、分页、空状态。但 DataTable 自建 `<table>`（通过 `useDataTableSort/Filter/Pagination/Selection` composables），DataTableSection 使用 Table 组件族（本地 ref+computed）。**列类型不兼容**（`DataTableColumn` vs `ColumnDef`）。

**方案（待评估）：** 列类型统一成本高，需先确定以哪套列类型为准。若以 DataTable 为准，DataTableSection 需重写模板；若以 Table 组件族为准，DataTable 需放弃自建 table。建议先评估使用场景与 API 复杂度再决定。

**当前结论：** 暂不执行，列入观察名单。

---

## 不动 — 仅文档化

### 12. Popover + Popconfirm

**现状（已核实）：** Popconfirm 直接使用 `Popover/PopoverTrigger/PopoverContent`，是 Popover 的薄包装，加了确认/取消按钮和 `TriangleAlert` 图标。Popover 本身仅是 `PopoverRootPrimitive` 的 8 行透传。

**方案：** 保留 Popconfirm 组件（语义清晰），在文档中说明其本质是 Popover + 按钮组合，提供两种用法的示例。无代码改动。

---

## 低优先级 — 暂不合并，仅记录

| 组件组 | 原因 |
|--------|------|
| Spinner 家族（4 种） | 视觉差异大，已共享 variants，保持独立合理 |
| Checkbox + Switch | 功能不同，reka-ui 原语不同，仅变体颜色可共享 |
| Select + Combobox + TreeSelect | 用途明确区分，底层原语不同（SelectRoot vs PopoverRoot） |
| Card 家族（9 种） | 已正确组合在 Card 基础上，无需合并 |

---

## 执行顺序

### 第一批 — 删除合并（断言已核实准确，需完整影响面处理）

1. **SubmitButton → Button** — 断言准确，迁移量最小
2. **SaaSPricing → PricingSection** — 需迁移 3 个 computed + 默认数据 + 类型
3. **TabsNav → Tabs** — 需迁移受控/非受控双模式状态管理

### 第二批 — 变体抽取（无删除，低风险）

4. **Button + GlitchButton** — 抽取 shared-button-variants.ts
5. **Input + Textarea** — 抽取 shared-input-variants.ts
6. **Dialog + AlertDialog + Sheet** — 扩展 modal-variants.ts
7. **TreeView + TreeSelect** — 抽取 tree-variants.ts
8. **StepperSection + Stepper** — 抽取 stepper-variants.ts
9. **Carousel + CarouselEnhanced** — 抽取 carousel-shared.ts

### 第三批 — 逻辑去重

10. **Upload + UploadCard** — 抽取 useUpload composable

### 第四批 — 评估成本

11. **DataTable + DataTableSection** — 列类型统一评估

### 不动

12. **Popover + Popconfirm** — 仅文档化

---

## 验证

每批完成后运行：

```bash
pnpm release:check          # 完整门禁：lint + typecheck + test + build + registry 校验
pnpm --filter docs build    # 文档站点构建验证
```

**第一批额外检查：**
- 确认 `packages/registry/registry/*.json` 已重建且不含已删除组件
- 确认 `apps/docs/.vitepress/config.ts` 侧边栏无失效链接
- 确认 `apps/docs/.vitepress/theme/components/demos/` 下无残留对已删除组件的 import

---

## 与原方案的差异说明

本修订版相对原方案的主要变更：

1. **修正事实性偏差：**
   - SaaSPricing："无独立逻辑"→ 实际含 3 个 computed + i18n + 默认数据
   - StepperSection："仅两个 computed"→ 实际 10 个 computed + 3 个方法
   - Carousel Enhanced："仅多了三项"→ 实际多 6 类功能（含 3 种指示器、联动、不同 composable）
   - Button variant："8 个"→ 9 个
   - TreeView/TreeSelect："几乎一致"→ 实现策略截然不同
   - Input/Textarea："完全重叠"→ size 值不同，Input 功能远多

2. **策略调整（基于决策）：**
   - StepperSection、CarouselEnhanced：合并 → 保留独立仅抽取共享变体
   - TreeView/TreeSelect：共享 TreeNode → 只共享变体
   - 向后兼容：明确为直接删除不保留 re-export

3. **补全影响面：**
   - 新增"通用影响面处理规范"章节
   - 每个删除合并项列出完整影响面清单（注册表、导出、shim、composable、测试、文档、侧边栏、Demo）
   - 验证命令从 `pnpm typecheck && pnpm test && pnpm build` 改为 `pnpm release:check` + `pnpm --filter docs build`
