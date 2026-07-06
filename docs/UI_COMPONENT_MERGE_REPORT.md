# UI 包可合并组件分析报告

日期：2026-07-07

## 结论

`packages/ui/src/components` 当前同时承载了基础组件、组合组件、区块组件和页面模板。真正值得优先合并的不是多文件原语组件，而是“区块/卡片/页面封装”与底层能力重复的组件。它们会扩大公共 API、注册表映射、国际化 key、测试和文档维护面。

建议按以下优先级处理：

| 优先级 | 合并候选 | 建议方向 | 主要收益 | 风险 |
| --- | --- | --- | --- | --- |
| P0 | `UploadCard` + `Upload` | 将卡片式上传作为 `Upload` 的预设/插槽示例，或让 `UploadCard` 复用 `Upload` 后逐步废弃 | 消除重复文件选择、拖拽、校验入口 | 中 |
| P0 | `DataTableSection` + `DataTable` | 先给 `DataTable` 补齐 section 外壳所需的 header/footer 能力，再复用现有 toolbar/empty/loading 能力并废弃独立区块 | 避免两套排序、搜索、分页逻辑 | 中高 |
| P1 | `StepperSection` + `Stepper` / `FormWizard` | 将导航按钮和内容面板作为 Stepper 可选布局，或迁移到 FormWizard 场景 | 减少步骤导航状态重复 | 中 |
| P1 | `ErrorCard` + `SuccessCard` + `Result` | 用 `Result` 承接 success/error/warning/info 状态，Card 风格作为 variant | 统一反馈结果 API 和视觉语义 | 中 |
| P1 | `LoadingPage` + `Loading` + `Spinner` | 将全页加载作为 `Loading` 的 fullscreen/page 变体，继续保留 `Spinner` 为原子组件 | 统一加载状态入口 | 低中 |
| P2 | `Statistic` + `Counter` | 将 `Statistic` 降级为 `Counter` 的 titled/card variant 或文档示例 | API 更薄，减少一层包装 | 低 |
| P2 | `DashboardStats` + `Statistic` / `Counter` | 复用 `Statistic` 或 `Counter` 渲染数值，不建议整体并入 | 减少数值展示重复 | 低中 |
| P3 | `Combobox` / `TreeSelect` / `Cascader` | 不合并组件，只抽共享 trigger、popover、clearable、displayText 逻辑 | 降低重复但保留清晰语义 | 中 |

## 判断标准

本次筛选使用以下信号：

- 是否只是基础组件的固定布局包装。
- 是否重复实现底层组件已经具备的核心逻辑。
- 是否作为同级公共导出和注册表条目出现，导致用户安装/文档/国际化成本增加。
- 是否有独立测试和文档，合并时需要保留兼容层。
- 是否语义不同但外观相似；这类只建议抽公共能力，不建议合并成大组件。

## 重点候选

### P0：`UploadCard` 合并进 `Upload`

现状：

- `Upload` 已负责 `fileList`、`limit`、`multiple`、`accept`、`maxSize`、`beforeUpload`、`beforeRemove`、`httpRequest`、`autoUpload`、`drag`、上传状态和暴露方法。
- `UploadCard` 自己维护 `fileInput`、拖拽态、`handleDrop`、`handleBrowse`、`handleFileChange`，只复用 `useUpload` 的校验能力，没有复用 `Upload.vue`。
- 注册表中两者是独立条目：`upload` 和 `upload-card`。

建议：

1. 先让 `UploadCard` 内部改为使用 `Upload` 的 `trigger` / `file-list` 插槽，保持原 API。
2. 在 `Upload` 增加官方 `card` 示例或 `variant="card"` 预设。
3. 下一次小版本在文档中标记 `UploadCard` 为 legacy/deprecated block；待注册表支持废弃元数据后同步标记，大版本再移除独立注册表条目。

最小测试：

- `pnpm test packages/ui/src/components/upload-card/upload-card.test.ts`
- `pnpm test packages/ui/src/components/upload/UploadFileItem.test.ts`

### P0：`DataTableSection` 合并进 `DataTable`

现状：

- `DataTableSection` 使用 `Table`、`Pagination`、`Input` 自行实现搜索、排序、分页、空状态和标题区域。
- `DataTable` 已有 `sortable`、`filterable`、`paginated`、`loading`、虚拟滚动、固定列、选择、展开、单元格渲染、toolbar/empty/loading 插槽和 composable 状态管理。
- 两者文档都存在，`DataTableSection` 属于更薄但重复的 section 封装。

建议：

1. 给 `DataTable` 补齐 section 场景需要的 `title`、`description`、`header`、`footer`、`framed` 或 `section` variant；当前已有的是 `toolbar`、`empty`、`loading` 等插槽，header/footer 需要新增。
2. 将 `DataTableSection` 改成 `DataTable` 的兼容 wrapper，内部做 `ColumnDef` 到 `DataTableColumn` 的映射。
3. 文档把 `DataTableSection` 从独立推荐入口迁到 “DataTable 区块示例/迁移说明”。

注意：

- 这里风险高于 `UploadCard`，因为 `DataTableSection` 的排序事件 payload 和简单 `ColumnDef` API 可能已被用户依赖。
- 合并时不要删除 `Table`，`Table` 是原语组件，不和 `DataTable` 重叠。

最小测试：

- `pnpm test packages/ui/src/components/data-table-section/data-table-section.test.ts`
- `pnpm test packages/ui/src/components/data-table/data-table.test.ts`

### P1：`StepperSection` 合并进 `Stepper` / `FormWizard`

现状：

- `Stepper` 已有 `modelValue`、`steps`、`orientation`、`clickable`、`nextStep`、`previousStep`、`goToStep` 暴露方法。
- `StepperSection` 再维护 `activeStep`、`canGoPrevious`、`canGoNext`、上一页/下一页按钮、内容 Card 和 empty 状态。
- `FormWizard` 已经复用 `Stepper`，说明步骤流的核心应留在 `Stepper` 或表单向导层。

建议：

1. 给 `Stepper` 增加可选 `controls` 插槽/布局文档，保留导航按钮作为示例。
2. 如果业务目标是表单流程，把 `StepperSection` 的“内容面板 + 上/下一步”迁到 `FormWizard` 文档，而不是继续作为独立 UI 包组件。
3. 短期保留 `StepperSection` wrapper，内部只组合 `Stepper` 和按钮，不再维护额外派生类型。

最小测试：

- `pnpm test packages/ui/src/components/stepper-section/stepper-section.test.ts`
- `pnpm test packages/ui/src/components/stepper/stepper.test.ts`
- 如触及表单向导：`pnpm test packages/ui/src/components/form/form-wizard.test.ts`

### P1：反馈结果组件收口

候选：`Result`、`ErrorCard`、`SuccessCard`。

现状：

- `Result` 已有 `status: success | warning | info | error`、图标槽、标题/副标题/extra。
- `ErrorCard` 固定为 Card + Alert + 关闭/重试按钮。
- `SuccessCard` 固定为 Card + 成功图标 + 确认按钮。
- 这三者解决的是同一类“结果/反馈状态展示”，只是默认动作不同。

建议：

1. 扩展 `Result`：增加 `variant="plain | card"`、`primaryAction`、`secondaryAction` 或 actions slot 示例。
2. 将 `ErrorCard` 和 `SuccessCard` 改成 `Result` 的薄 wrapper，保留现有事件名 `retry`、`close`、`confirm`。
3. 长期把 docs 中的 `error-card`、`success-card` 合并到 `Result` 的状态示例页。

注意：

- `ErrorCard` 还复用 `Alert`，合并时要确认 `Alert` 视觉是否需要作为 `Result` 的 `error` card variant。

最小测试：

- `pnpm test packages/ui/src/components/result/Result.test.ts`
- `pnpm test packages/ui/src/components/error-card/error-card.test.ts`
- `pnpm test packages/ui/src/components/success-card/success-card.test.ts`

### P1：加载组件收口

候选：`LoadingPage`、`Loading`、`Spinner`。

现状：

- `Spinner` 是原子加载指示器，且被 `Loading`、`LoadingPage`、`Combobox`、`SearchWidget` 等复用。
- `Loading` 是局部遮罩和 `v-loading` 指令入口。
- `LoadingPage` 是全页布局，内部组合 `Skeleton`、`Spinner`、`Progress`。

建议：

1. 保留 `Spinner` 原子组件，不合并。
2. 给 `Loading` 增加 `fullscreen` / `page` 模式，或提供 `Loading.Page` 风格的子组件导出。
3. 将 `LoadingPage` 作为 `Loading` 的兼容 wrapper，内部改用统一 props 和 slots。

最小测试：

- `pnpm test packages/ui/src/components/loading/loading.test.ts`
- `pnpm test packages/ui/src/components/loading-page/loading-page.test.ts`
- `pnpm test packages/ui/src/components/spinner/spinner.test.ts`

### P2：`Statistic` 合并进 `Counter`

现状：

- `Statistic` 的核心显示完全依赖 `Counter`，只是增加 `title`、`card`、`valueStyle` 和命名差异：`value` -> `to`、`precision` -> `decimals`、`groupSeparator` -> `separator`。
- `Counter` 已支持前后缀、组件前后缀、动画、格式化、尺寸和 variant。

建议：

1. 在 `Counter` 增加可选 `title` slot/prop 与 `card` variant，或仅在文档中给出组合示例。
2. 保留 `Statistic` 作为兼容 wrapper，将 props 映射到 `Counter`。
3. 大版本考虑移除独立注册表条目 `statistic`。

最小测试：

- `pnpm test packages/ui/src/components/statistic/Statistic.test.ts`
- `pnpm test packages/ui/src/components/counter/counter.test.ts`

### P2：`DashboardStats` 复用 `Statistic`

现状：

- `DashboardStats` 是卡片网格区块，带图标、趋势、Badge、Progress 和点击事件。
- 它不是 `Statistic` 的同义组件，但其中的数值展示可以复用 `Statistic` 或 `Counter`，避免未来数值格式、动画策略分叉。

建议：

- 不建议整体并入 `Statistic`。
- 建议把数值区域改为 `Statistic`/`Counter`，并保留 `DashboardStats` 作为 dashboard block。

最小测试：

- `pnpm test packages/ui/src/components/dashboard-stats/dashboard-stats.test.ts`
- 如复用 `Counter`：`pnpm test packages/ui/src/components/counter/counter.test.ts`

## 不建议直接合并的组件

### `Combobox`、`TreeSelect`、`Cascader`

这三者都有 Popover trigger、清除按钮、显示文本、搜索/选择状态，但语义差异明显：

- `Combobox` 是扁平列表，可创建选项，可 loading。
- `TreeSelect` 是树结构，支持展开节点、递归渲染、单选/多选。
- `Cascader` 是路径选择，支持多列级联、路径展示、父子严格选择。

建议抽共享能力：

- `useSelectableTrigger`
- `useDisplayText`
- `useClearableSelection`
- 统一 trigger variant 和 clear icon 样式

不建议合成一个 “UniversalSelect”，否则类型和键盘交互都会变复杂。

### `Table` 和 `DataTable`

`Table` 是语义表格原语，`DataTable` 是数据驱动的复杂组件。二者应保持分层，不合并。需要合并的是 `DataTableSection` 这种中间重复层。

### `Card` 和 `Card3D`

`Card3D` 是带 3D 指针交互的特色组件，和基础 `Card` 的行为不同。可共享 card variant 或视觉 token，但不建议合并公共 API。

### `Calendar` 和 `DatePicker`

两者都依赖 `v-calendar`，但 `Calendar` 是内联日期面板，`DatePicker` 是触发器 + 弹层 + 格式化 + 快捷选项的一组复杂选择器。可抽 `VDatePickerPanel` 内部封装，但不建议对外合并。

## 迁移策略

建议采用“先内部复用，再文档降级，最后注册表移除”的三步走：

1. 内部复用：把 wrapper 改为组合底层组件，保持原 props/events。
2. 文档降级：将 wrapper 从推荐组件页移动到区块示例或迁移说明。
3. 注册表治理：先为 `RegistryComponentMeta` / `ComponentFileMapping` 设计 `legacy`、`deprecated` 或 `replacement` 元数据字段，并同步 CLI、注册表校验和文档展示；字段落地后再在 `packages/shared/src/components.ts` 和 `packages/registry/scripts/component-files.ts` 中标记 legacy，大版本再移除。

每一批只处理一组候选，避免全局 API 和文档同时震荡。

## 建议执行顺序

1. `UploadCard` -> `Upload`：收益高，范围最清晰。
2. `Statistic` -> `Counter`：低风险，用来建立兼容 wrapper 模式。
3. `Result` <- `ErrorCard` / `SuccessCard`：统一反馈语义。
4. `LoadingPage` -> `Loading`：统一 loading 入口。
5. `DataTableSection` -> `DataTable`：收益高但风险更大，放在有 wrapper 经验之后。
6. `StepperSection` -> `Stepper` / `FormWizard`：需要先决定它是通用步骤组件还是表单/页面区块。

## 需要同步更新的区域

- `packages/ui/src/index.ts`：公共导出与兼容导出。
- `packages/shared/src/components.ts`：CLI 可用组件元数据。
- `packages/registry/scripts/component-files.ts`：复制粘贴注册表映射。
- `apps/docs/blocks/*` 和 `apps/docs/components/*`：中英文文档入口和示例。
- `packages/ui/src/locales/*`：legacy 组件对应的 locale key 是否保留。
- 对应组件测试：遵守项目约定，只跑被修改组件的最小化测试。
