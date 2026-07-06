# UI 组件精简与相似组件合并报告

日期：2026-07-07

## 摘要

`packages/ui/src/components` 当前有 105 个组件目录，`packages/shared/src/components.ts` 中也有 105 个组件元数据条目，两者已经对齐。上一轮报告中提到的 `UploadCard`、`DataTableSection`、`Statistic`、`ErrorCard`、`SuccessCard`、`LoadingPage`、`StepperSection` 等旧组件目录已不在当前组件目录和共享元数据中，对应 docs demo 残留也已从 VitePress theme 入口和 demo 目录清理，第一轮精简已经闭环。

下一轮精简的重点不应继续从基础原语组件下手，而应处理三类维护成本较高的组件：

1. 功能增强版与基础版并存的组件，例如 `CarouselEnhanced` 与 `Carousel`、`GlitchButton` 与 `Button`。
2. 页面、区块、卡片模板类组件，例如 `OverviewPage`、`BlogListPage`、`BlogCard`、`FileCard`、`TestimonialCard`。
3. 多个组件重复实现相似 trigger、popover、搜索、清除、反馈、动作按钮的组件族，例如选择器族、反馈族、浮层族。

建议采用“先收束 API 和内部复用，再降级公共入口，最后删除 registry 条目”的方式推进。不要把语义不同但外观相似的组件硬合并成大而全组件。

## 当前状态

| 项目 | 当前数量/状态 | 说明 |
| --- | ---: | --- |
| 组件目录 | 105 | 来自 `packages/ui/src/components` |
| 共享组件元数据 | 105 | 来自 `packages/shared/src/components.ts` |
| 旧组件源码目录 | 0 | 旧报告中的 7 个候选目录已删除 |
| 旧组件 docs demo 残留 | 0 | 已删除 `DataTableSectionDemo`、`ErrorCardDemo`、`LoadingPageDemo`、`StatisticDemo`、`StepperSectionDemo`、`SuccessCardDemo`、`UploadCardDemo`，并同步移除 VitePress theme 入口 import/register |
| registry 生命周期字段 | 已具备 | `RegistryItem` / `RegistryIndexItem` 已有 `status` 与 `replacement` 字段，可用于 deprecated/legacy 迁移 |

## 判断标准

本报告按以下标准判断是否适合合并：

- 是否只是另一个组件的固定布局、默认插槽或演示包装。
- 是否重复实现已有组件的核心交互，例如搜索、分页、弹层、清除、状态反馈。
- 是否作为独立公共导出和 registry 条目存在，导致用户安装、文档、测试、国际化成本增加。
- 合并后是否仍能保持清晰语义和可维护类型。
- 是否能通过兼容 wrapper 平滑迁移，而不是一次性破坏公共 API。

## 优先级总览

| 优先级 | 候选组件 | 建议方向 | 收益 | 风险 |
| --- | --- | --- | --- | --- |
| P0 | `CarouselEnhanced` + `Carousel` | 合并为 `Carousel` 的增强 props 或 slots，保留兼容导出 | 少一个公开增强版入口 | 中 |
| P1 | `GlitchButton` + `Button` | 将 glitch 行为做成 `Button` 的 `effect` 或内部包装，保留 `GlitchButton` 兼容层 | 统一按钮 loading、disabled、ARIA、尺寸变体 | 中 |
| P1 | `SearchWidget` + `Command` | 将 SearchWidget 降级为 Command 搜索预设/示例 | 减少搜索组件重复状态 | 中 |
| P1 | `OverviewPage` + `DashboardStats` + `Card` | `OverviewPage` 转为 docs block/template，不再作为核心 UI 组件推荐 | 降低页面模板 API 面 | 中 |
| P1 | `BlogListPage` + `BlogCard` | 将列表页降级为 `BlogCard` 组合模板 | 减少页面级组件 | 低中 |
| P2 | `BlogCard` + `FileCard` + `TestimonialCard` | 不直接合并，抽 `Card` preset 或迁移为 block 示例 | 保留语义，减少重复样式 | 低中 |
| P2 | `EmptyState` + `Result` | 统一空状态/结果状态的图标、标题、动作插槽 | 统一反馈展示模型 | 中 |
| P2 | `InputAdornment` + `Input` | 将 adornment 能力并入 `Input` 或仅作为内部辅助组件 | 减少薄包装公共入口 | 低中 |
| P3 | `Select` / `Combobox` / `TreeSelect` / `Cascader` / `Transfer` | 不合并公共组件，只抽共享 trigger、popover、clearable、displayText 逻辑 | 降低重复但保留语义 | 中 |
| P3 | `Dialog` / `AlertDialog` / `Sheet` / `Popover` / `Popconfirm` / `Tooltip` / `DropdownMenu` / `Command` / `Tour` | 不合并公共组件，统一 overlay primitives 和样式 token | 保持无障碍语义清晰 | 中 |

## P0：第一轮精简尾巴已清理

旧报告中的第一批候选已经从组件源码、registry 元数据和 docs demo 编译入口中消失。以下旧 demo 已删除，并已同步移除 `apps/docs/.vitepress/theme/index.ts` 中的静态 import/register：

- `DataTableSectionDemo`
- `ErrorCardDemo`
- `LoadingPageDemo`
- `StatisticDemo`
- `StepperSectionDemo`
- `SuccessCardDemo`
- `UploadCardDemo`

这批 demo 曾经从 `brutx-ui-vue` 导入已删除的 `DataTableSection`、`ErrorCard`、`LoadingPage`、`Statistic`、`StepperSection`、`SuccessCard`、`UploadCard`，会导致 docs 构建解析已删除导出。当前清理后，第一轮精简尾巴不再作为下一轮 P0 工作项。

同步检查范围：

- `apps/docs/.vitepress/config.ts`
- `apps/docs/.vitepress/theme/index.ts`
- `apps/docs/.vitepress/theme/components/demos/`
- `apps/docs/blocks/*`
- `apps/docs/en/blocks/*`
- `packages/registry/registry/index.json`

## P0：`CarouselEnhanced` 合并进 `Carousel`

现状：

- `Carousel.vue` 与 `CarouselEnhanced.vue` 同在 `carousel` 组件目录。
- 两者都处理 Embla 轮播、箭头、圆点、自动播放等能力。
- `CarouselEnhanced` 额外提供缩略图、自动播放指示器、视差配置。
- 当前 registry 只有 `carousel` 条目，但 `carousel` 的文件映射和生成产物仍包含 `CarouselEnhanced.vue` 与 `useCarouselEnhanced.ts`。
- 公共导出层仍暴露增强版能力，文档 demo 也有 `CarouselEnhancedDemo.vue`。

建议：

1. 把 `CarouselEnhanced` 的增强能力收进 `Carousel`，通过 `thumbnails`、`autoplayIndicator`、`parallax` 等可选 props 或插槽开启。
2. 保留 `CarouselEnhanced` 作为兼容 wrapper，一段时间内只转发到 `Carousel`。
3. 同步更新 `packages/shared/src/component-files.ts` 中 `carousel` 的文件列表，以及 `packages/ui/src/composables/index.ts` 中 `useCarouselEnhanced` 的导出策略。
4. 文档只保留一个 `Carousel` 页面，把增强用法变成同页示例。
5. 下一次大版本移除 `CarouselEnhanced` 命名导出和独立 demo。

最小验证：

- `pnpm test packages/ui/src/components/carousel/carousel.test.ts`
- `pnpm test packages/ui/src/components/carousel/CarouselEnhanced.test.ts`
- `pnpm test packages/ui/src/composables/useCarouselEnhanced.test.ts`

## P1：`GlitchButton` 收进 `Button` 效果体系

现状：

- `GlitchButton` 和 `Button` 都使用 `Primitive`、loading 图标、disabled 状态、尺寸和变体。
- `GlitchButton` 额外维护 glitch 触发方式、自动播放定时器、动效方向和 reduced motion 降级。
- 两者的基础按钮语义重复，长期容易让 loading、ARIA、尺寸、变体表现分叉。

建议：

1. 在 `Button` 中增加可选 `effect="none | glitch"`，或提取内部 `BrutalButtonBase` 后让二者共用。
2. 将 glitch 触发逻辑抽成 `useGlitchEffect`，由 `GlitchButton` 和未来其他组件复用。
3. `GlitchButton` 保留为兼容导出，但实现改为组合 `Button effect="glitch"`。
4. 文档把 `GlitchButton` 从独立按钮入口降级为 `Button` 的特色效果示例。

注意：

- 不建议立即删除 `GlitchButton`，因为它是新粗野主义特色组件，可能有独立营销价值。
- 先统一底层按钮语义，再决定是否移除公开名称。

最小验证：

- `pnpm test packages/ui/src/components/button/button.test.ts`
- `pnpm test packages/ui/src/components/glitch-button/glitch-button.test.ts`
- `pnpm test packages/ui/src/components/button/button.a11y.test.ts`

## P1：`SearchWidget` 降级为 `Command` 搜索预设

现状：

- `SearchWidget` 内部组合 `Card`、`Command`、`CommandInput`、`CommandList`、`CommandGroup`、`CommandItem`、`CommandEmpty` 和 `Spinner`。
- 它自己维护 `query`、过滤、最近搜索、loading 和 select 事件。
- `Command` 已是命令面板/搜索列表的底层能力。

建议：

1. 给 `Command` 文档增加“搜索组件/最近搜索/加载态”示例。
2. 把 `SearchWidget` 改为薄 wrapper，内部只传入 `Command` 组合。
3. 如果精简目标偏激进，下一大版本把 `SearchWidget` 从核心 UI 组件迁到 blocks 或 docs recipe。

风险：

- `SearchWidget` 的 `search` / `select` 事件可能已有用户依赖；先保留 wrapper 更稳。

最小验证：

- `pnpm test packages/ui/src/components/search-widget/search-widget.test.ts`
- `pnpm test packages/ui/src/components/command/command.test.ts`

## P1：页面模板组件移出核心组件层

候选：

- `OverviewPage`
- `BlogListPage`
- `ActivityLogPage`
- `ProfilePage`
- `SettingsPage`
- `WaitlistPage`
- `NotFoundPage`

现状：

- 这些组件大多是 `Card`、`Button`、`Badge`、`Input`、`EmptyState`、`DashboardStats`、`Timeline` 等基础组件的固定组合。
- 它们有独立 props、locale key、测试和 registry 条目，会显著扩大公共 API 面。
- 其中 `OverviewPage` 已直接组合 `DashboardStats` 与多个 `Card`，更像应用模板而不是 UI 原语。

建议：

1. 保留 `DashboardShell` 这类高复用布局骨架。
2. 将页面级组件逐步从核心推荐入口迁到 `blocks` 或 recipe 文档。
3. 每个页面组件保留兼容 wrapper 一段时间，并在 registry 中使用 `status: 'legacy'` 与 `replacement` 指向组合组件。
4. 新增页面能力优先写成 docs 模板，不再新增核心包组件。

建议迁移映射：

| 当前组件 | 推荐替代 |
| --- | --- |
| `OverviewPage` | `DashboardShell` + `DashboardStats` + `Card` + `EmptyState` |
| `BlogListPage` | `BlogCard` + `Pagination` + `Tabs` 或过滤控件 |
| `ActivityLogPage` | `Timeline` + `Badge` + `Card` |
| `ProfilePage` | `Avatar` + `Descriptions` + `Card` + `Button` |
| `SettingsPage` | `Tabs` + `Form` + `Switch` + `Card` |
| `WaitlistPage` | `BrutalistHero` + `Input` + `Button` |
| `NotFoundPage` | `Result status="error"` + `Button` |

## P2：卡片模板族收束为 Card presets 或 blocks

候选：

- `BlogCard`
- `FileCard`
- `TestimonialCard`
- `DashboardStats`
- `QuickActions`
- `FaqSection`
- `GallerySection`
- `ChartSection`

现状：

- 这些组件不是完全重复，但大多是固定内容模型的区块或卡片模板。
- `BlogCard`、`FileCard`、`TestimonialCard` 都是 `Card` + 图标/元数据/动作的封装。
- `FaqSection` 已可由 `Accordion` 组合表达。
- `ChartSection` 与 `SketchyChart` 存在“区块包装 vs 图表原子”的分层关系。

建议：

1. 不要把这些卡片合成一个 `UniversalCard`。
2. 在 `Card` 文档中增加 `article`、`file`、`testimonial`、`stat` 等 preset 示例。
3. 对业务模板型组件使用 `status: 'legacy'` 标记并迁移到 blocks 文档。
4. `DashboardStats` 可保留为 dashboard block，但内部数值展示应复用 `Counter`，避免数字格式化策略分叉。

## P2：`EmptyState` 与 `Result` 统一反馈展示模型

现状：

- `Result` 已支持 `success | warning | info | error` 状态、标题、副标题、图标和 extra 插槽。
- `EmptyState` 解决“无数据”状态，包含图标、标题、描述和 action。
- 两者在结构上都是“图标 + 文案 + 操作”的状态展示。

建议：

1. 给 `Result` 增加 `status="empty"` 或 `kind="empty"` 的语义，或者提供 `Result.Empty` 风格子导出。
2. `EmptyState` 保留为兼容 wrapper，内部映射到 `Result`。
3. 文档里将空状态放到 `Result` 的状态示例中，同时保留 `EmptyState` 迁移说明。

风险：

- 空状态和结果状态的文案语义不同，合并时要保留 `EmptyState` 的默认 locale key，避免用户升级后文案变化。

## P2：`InputAdornment` 并入 `Input` 能力边界

现状：

- `Input` 已支持 `prefixIcon`、`suffixIcon`、`prepend`、`append` 等能力。
- `InputAdornment` 是一个薄包装组件，用于包裹目标组件并添加前后缀。
- `InputAdornment` 没有对应测试覆盖，维护收益偏低。
- `InputAdornment` 不只是 `packages/ui/src/index.ts` 的公共导出，还存在于 `packages/shared/src/components.ts`、`packages/shared/src/component-files.ts` 和已生成的 registry 条目中。

建议：

1. 如果只服务 `Input`，先将 `InputAdornment` 标记为 `legacy` 或 `deprecated`，`replacement` 指向 `input`，再在后续大版本移除公共导出和 registry 条目。
2. 如果要支持 `Textarea`、`SelectTrigger` 等通用 adornment，改名为更明确的内部布局 primitive，并补测试。
3. 文档中优先推荐 `Input` 自身的前后缀 props/slots。

最小验证：

- `pnpm test packages/ui/src/components/input/input.test.ts`

## P3：选择器族不直接合并，只抽共享能力

候选：

- `Select`
- `Combobox`
- `TreeSelect`
- `Cascader`
- `Transfer`

结论：

不建议合并成一个 `UniversalSelect`。这些组件外观相似，但数据模型和交互语义不同：

- `Select` 是单值列表选择。
- `Combobox` 是可搜索、可多选、可创建选项的命令列表式选择。
- `TreeSelect` 是递归树选择。
- `Cascader` 是路径级联选择。
- `Transfer` 是双栏移动列表。

建议抽取的共享能力：

- `useSelectableTrigger`
- `useSelectionDisplayText`
- `useClearableSelection`
- 统一 trigger variant、清除按钮、loading/empty 文案、键盘焦点样式

这样可以降低重复，但不会牺牲类型清晰度。

## P3：浮层反馈族保持语义分层

候选：

- `Dialog`
- `AlertDialog`
- `Sheet`
- `Popover`
- `Popconfirm`
- `Tooltip`
- `DropdownMenu`
- `Command`
- `Tour`

结论：

不建议把这些组件合并为单个 overlay 组件。它们的无障碍语义、焦点管理、关闭规则和使用场景差异明显。

建议只统一内部能力：

- 统一 overlay z-index、阴影、边框、动画 token。
- 抽共享 close button、overlay content variant。
- `Popconfirm` 继续作为 `Popover` + `Button` 的薄 wrapper。
- `CommandDialog` 继续复用 `Dialog` 语义，而不是反向合并。

## 不建议合并的组件组

| 组件组 | 原因 |
| --- | --- |
| `Table` + `DataTable` | `Table` 是语义表格原语，`DataTable` 是数据驱动复杂组件，应保持分层 |
| `Calendar` + `DatePicker` | `Calendar` 是内联日期面板，`DatePicker` 是触发器、弹层、格式化和快捷选项组合 |
| `Card` + `Card3D` | `Card3D` 有指针交互和动效语义，可共享 token 但不应合并 API |
| `Spinner` + `Loading` + `Skeleton` + `Progress` | 都是加载/进度反馈，但分别表示指示器、遮罩、占位和进度，不应合并 |
| `Menu` + `DropdownMenu` | 一个偏导航菜单，一个偏浮层操作菜单，键盘和弹层语义不同 |
| `TreeView` + `TreeSelect` | 一个是导航/数据展示，一个是表单选择器，可共享树节点逻辑但不合并公共组件 |
| `Image` + `GallerySection` + `BeforeAfter` | 都处理图片，但分别是图片原子、画廊区块、对比交互 |

## 建议执行顺序

1. 合并 `CarouselEnhanced` 到 `Carousel`，建立“增强版兼容 wrapper”模式。
2. 将 `GlitchButton` 底层改为复用 `Button`，抽出 `useGlitchEffect`。
3. 将 `SearchWidget` 降级为 `Command` recipe 或兼容 wrapper。
4. 对页面级组件加 `status: 'legacy'` 与 `replacement`，迁移到 blocks 文档。
5. 收束卡片模板族，优先写成 `Card` 示例和 blocks。
6. 抽选择器族与浮层族共享 composable/variant，不合并公共组件。

## 需要同步更新的文件

- `packages/ui/src/index.ts`：公共导出、兼容导出、最终移除导出。
- `packages/ui/src/composables/index.ts`：增强 composable 的兼容导出与最终移除策略。
- `packages/shared/src/components.ts`：组件元数据、`status`、`replacement`。
- `packages/shared/src/component-files.ts`：复制粘贴注册表文件映射。
- `packages/shared/src/component-registry.ts`：分类和 legacy 展示策略。
- `packages/registry/scripts/build-registry.ts`：生成 registry 时保留或过滤 legacy 的策略。
- `packages/registry/registry/*`：生成产物，不建议手动编辑。
- `apps/docs/.vitepress/theme/index.ts`：docs demo 全局注册，旧 demo 删除时必须同步移除静态 import 与注册。
- `apps/docs/components/*`、`apps/docs/blocks/*`、`apps/docs/en/*`：组件页、区块页、迁移说明。
- `apps/docs/.vitepress/theme/components/demos/*`：删除旧 demo 或改为新组件示例。
- `packages/ui/src/locales/*`：兼容 wrapper 的默认文案与废弃组件 locale key。

## 最小测试策略

遵守项目约定，按修改范围运行最小测试，不运行全量门禁：

| 修改范围 | 最小测试 |
| --- | --- |
| docs demo 清理 | 定向检查 `apps/docs/.vitepress/theme/index.ts` 与相关 demo import，必要时运行 docs 构建 |
| `Carousel` 合并 | `pnpm test packages/ui/src/components/carousel/carousel.test.ts packages/ui/src/components/carousel/CarouselEnhanced.test.ts packages/ui/src/composables/useCarouselEnhanced.test.ts` |
| `Button` / `GlitchButton` | `pnpm test packages/ui/src/components/button/button.test.ts packages/ui/src/components/glitch-button/glitch-button.test.ts` |
| `SearchWidget` / `Command` | `pnpm test packages/ui/src/components/search-widget/search-widget.test.ts packages/ui/src/components/command/command.test.ts` |
| `Result` / `EmptyState` | `pnpm test packages/ui/src/components/result/Result.test.ts packages/ui/src/components/empty-state/empty-state.test.ts` |
| `InputAdornment` / `Input` | `pnpm test packages/ui/src/components/input/input.test.ts`，并定向检查 shared metadata、component-files 与 registry 生命周期字段 |

## 推荐结论

当前组件库已经完成了一轮明显的重复组件删除。下一轮最有价值的目标是减少“增强版公开入口”和“页面/区块模板公开入口”，而不是合并底层原语。

推荐先处理 `CarouselEnhanced`，因为它边界清晰、风险可控；再处理 `GlitchButton`、`SearchWidget` 和页面模板降级。选择器族、浮层族、加载反馈族只做共享逻辑抽取，不做公共组件合并。
