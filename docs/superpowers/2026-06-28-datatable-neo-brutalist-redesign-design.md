# DataTable Neo-Brutalist 重构设计

* 日期：2026-06-28

* 范围：`packages/ui/src/components/data-table/`、`packages/ui/src/components/data-table-section/`、`packages/ui/src/composables/`、`packages/registry/scripts/component-files.ts`

* 类型：视觉修复 + API 补全 + composable 拆分（合并为单一 spec）

## 1. 背景与问题

`DataTable.vue` 当前实现偏离 `VISUAL_SYSTEM.md` 的 Neo-Brutalist 规范，共 6 类问题：

1. **边框宽度违规** — checkbox、分页按钮、页大小 select、selection info 使用 `border-2` / `border-t-2`；head cell 与 body cell 用 `border-r-2`；body 用 `divide-y-2`。规范要求 `border-3 border-brutal`。
2. **opacity 淡化粗重边框** — `border-brutal/20`、`border-brutal/10`、`divide-brutal/10`、`bg-brutal-primary/10` 违反"禁止暗淡边框"。
3. **缺失按压反馈（反模式 4）** — 分页按钮、导出按钮、可排序表头无 `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none`。
4. **缺失悬停位移与阴影（规则 5）** — 分页按钮无 `shadow-brutal`、无 `hover:-translate-x/y-0.5`；filter 输入框用 `focus:ring-2` 而非 `focus:shadow-brutal`。
5. **内联类绕过 CVA** — filter input、export 按钮、分页按钮、页大小 select 用裸 Tailwind 字符串，未走 `inputVariants` / `buttonVariants`。`dataTableRootVariants` 的 `size` 变体定义了却从未传入；`dataTableRowVariants` 的 `striped` 变体未暴露为 prop。
6. **细节问题** — 导出按钮 `text-brutal-fg` 应为 `text-brutal-primary-foreground`；loading 用 `backdrop-blur-sm`（玻璃化反模式）；空状态用 `text-brutal-fg/50` 淡化；排序图标 `opacity-30` 淡化。

## 2. 目标

* 让 DataTable 完全符合 `VISUAL_SYSTEM.md` 全部 6 条规则与 4 条反模式

* 通过 composable 拆分让排序/过滤/选择/分页逻辑可独立单测

* 复用 `Input` / `Button` 组件，消除内联 class 与样式重复

* 暴露已定义但未启用的 `size` / `striped` 变体，并新增 `dense` / `stickyHeader` prop

* 保持向后兼容（除 `striped` 默认值变更，见 §4）

## 3. 非目标

* 不引入 `Select` 组件（项目当前无此组件，页大小下拉沿用原生 `<select>` + `inputVariants` 样式）

* 不抽取 `DataTableToolbar.vue` / `DataTablePagination.vue` 等子组件（避免过度拆分，DataTable 结构紧密）

* 不改 `DataTableColumn<T>` 类型签名

* 不实现列宽拖拽调整（`resizable` prop 保留但不增强）

* 不动 `data-table-section` 的 API，仅视觉修复

## 4. API 设计

### 4.1 DataTable 新增 props

```ts
size?: 'sm' | 'default' | 'lg'   // 默认 'default'，控制字体 + cell padding
dense?: boolean                    // 默认 false，进一步压缩行高（与 size 正交）
striped?: boolean                  // 默认 true，奇偶行交替 bg-brutal-bg / bg-brutal-muted
stickyHeader?: boolean             // 默认 false，长表时表头吸顶
```

### 4.2 沿用不变的 props

`data`, `columns`, `sortable`, `filterable`, `selectable`, `resizable`, `paginated`, `pageSize`, `pageSizeOptions`, `loading`, `emptyMessage`, `rowKey`, `virtualScroll`, `class` — 签名与默认值不变。

### 4.3 emit 不变

`sort`, `filter`, `select`, `pageChange`, `pageSizeChange`, `export` — 全部保留。

### 4.4 slots

保留：`toolbar`, `cell-${column.id}`, `empty`。
新增：`loading` — 允许自定义加载态，默认渲染 brutalist 加载块（见 §5.5）。

### 4.5 向后兼容性

* 新 props 全部可选、有默认值，旧调用零改动即可工作

* **唯一行为变更**：`striped` 默认 `true`（旧版无 striping）。若调用方依赖"无 striping"外观，需显式 `:striped="false"`。文档迁移指南会标注

* `data-table-variants.ts` 中现有 `striped` variant 从"未暴露"变为"由 prop 控制"，无破坏

### 4.6 DataTableSection

无新增 props / slots / emit。仅视觉修复。

## 5. 视觉规范（CVA variants）

### 5.1 总体原则

每个元素遵守 `border-3 border-brutal` + `shadow-brutal*` + 按压反馈 + `rounded-brutal`。禁止 `border-2` / `border-*` opacity 淡化 / `backdrop-blur` / `ring-2` 替代阴影。

> 注：`bg-brutal-accent/20` 这类**填充淡化**允许（不是边框淡化）；`border-brutal/数字` 这类**边框淡化**禁止。

### 5.2 `data-table-variants.ts` 改写要点

```ts
// Root：补 rounded-brutal，size 变体真正生效（dense 不在 root，仅在 cell 生效）
export const dataTableRootVariants = cva([
    'w-full border-3 border-brutal rounded-brutal',
    'bg-brutal-bg text-brutal-fg',
    'shadow-brutal-lg relative',
], {
    variants: {
        size: { sm: 'text-sm', default: 'text-base', lg: 'text-lg' },
    },
    defaultVariants: { size: 'default' },
})

export const dataTableHeaderVariants = cva([
    'border-b-3 border-brutal bg-brutal-muted font-black',
])

export const dataTableHeadVariants = cva([
    'px-4 py-3 text-left first:border-l-0',
], {
    variants: {
        sortable: {
            true: 'cursor-pointer select-none hover:bg-brutal-accent/40 '
                + 'active:translate-y-[var(--brutal-pressed-offset,2px)] active:bg-brutal-accent',
            false: '',
        },
        align: { left: 'text-left', center: 'text-center', right: 'text-right' },
        active: { true: 'bg-brutal-accent', false: '' },  // 激活排序列整列高亮
    },
    defaultVariants: { sortable: false, align: 'left', active: false },
})

export const dataTableBodyVariants = cva([])  // 移除 divide-y-2 divide-brutal/10

export const dataTableRowVariants = cva([
    'transition-colors duration-150 hover:bg-brutal-muted',
], {
    variants: {
        selected: { true: 'bg-brutal-primary text-brutal-primary-foreground', false: '' },
        striped: { true: 'even:bg-brutal-muted/50', false: '' },
    },
    defaultVariants: { selected: false, striped: true },
})

export const dataTableCellVariants = cva([
    'px-4 py-3',
], {
    variants: {
        align: { left: 'text-left', center: 'text-center', right: 'text-right' },
        size: { sm: 'py-2', default: 'py-3', lg: 'py-4' },
        dense: { true: 'py-1.5', false: '' },
        active: { true: 'bg-brutal-accent/20', false: '' },
    },
    defaultVariants: { align: 'left', size: 'default', dense: false, active: false },
})

export const dataTableToolbarVariants = cva([
    'flex items-center justify-between gap-4 p-4',
    'border-b-3 border-brutal bg-brutal-bg',
])

export const dataTablePaginationVariants = cva([
    'flex items-center justify-between gap-4 p-4',
    'border-t-3 border-brutal bg-brutal-muted',
])

export const dataTableEmptyVariants = cva([
    'flex flex-col items-center justify-center gap-2',
    'py-12 px-4 text-brutal-fg border-t-3 border-brutal',
])

export const dataTableLoadingVariants = cva([
    'absolute inset-0 flex items-center justify-center',
    'bg-brutal-bg z-10',  // 实色，去 backdrop-blur
])
```

### 5.3 复用 Input/Button 替换的内联 class

| 位置             | 旧（内联）                              | 新                                                                                                        |
| -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| filter 输入框     | 裸 `<input>` + `focus:ring-2`       | `<Input v-model="filterState.global" :placeholder="t('dataTable.filterPlaceholder')" size="sm" />`       |
| 导出 CSV 按钮      | 裸 `<button>` + `text-brutal-fg`（错） | `<Button variant="primary" size="sm" @click="exportData('csv')">{{ t('dataTable.exportCsv') }}</Button>` |
| 4 个分页按钮        | 裸 `<button>` + `border-2` + 无阴影    | `<Button variant="default" size="icon" :disabled="..." :aria-label="..." @click="...">`                  |
| 页大小 `<select>` | 裸 `<select>` + `border-2`          | 原生 `<select>` + `class={inputVariants({ inputSize: 'sm' })}`（项目无 Select 组件）                              |

Checkbox 保留原生 `<input type="checkbox">`，class 改 `w-4 h-4 border-3 border-brutal accent-brutal-primary cursor-pointer`。若浏览器对原生 checkbox 的 `border-3` 渲染不一致，则用外层 `<span class="inline-flex border-3 border-brutal p-0.5">` 包裹原生 checkbox（去自身 border），保证视觉粗边框。

### 5.4 排序列高亮逻辑（模板侧）

`visibleColumns` 渲染时，对 `sortState.column === column.id && sortState.direction` 的列：

* 该列 `<th>` 加 `active: true` variant → `bg-brutal-accent`

* 该列所有 `<td>` 加 `active: true` variant → `bg-brutal-accent/20`

* 排序图标去掉 `opacity-30`，未激活用 `text-brutal-fg`（实色，靠图标类型区分）

### 5.5 Loading 状态重构

* 容器去 `backdrop-blur-sm`，改实色 `bg-brutal-bg`

* 加载块用 `Loader2` 包裹在 `border-3 border-brutal bg-brutal-bg p-2 shadow-brutal` 容器内

* 暴露 `loading` slot 允许自定义

### 5.6 Empty 状态重构

* 容器 `border-t-3 border-brutal`，文案 `text-brutal-fg`（不再 /50 淡化）

* 新增一个粗边框小图标块：`Inbox` 图标 + `border-3 border-brutal shadow-brutal p-3`

### 5.7 Selection info bar 重构

```ts
// 旧：px-4 py-2 border-t-2 border-brutal bg-brutal-primary/10 text-sm font-bold
// 新：实色 + 粗边
'sticky bottom-0 px-4 py-2 border-t-3 border-brutal '
+ 'bg-brutal-primary text-brutal-primary-foreground text-sm font-black'
```

### 5.8 Sticky header

`stickyHeader=true` 时 `<thead>` 加 `sticky top-0 z-10`。

### 5.9 DataTableSection 视觉修复

* 标题区 `border-b-3 border-brutal`、操作区按钮复用 `<Button>`

* 整体 `shadow-brutal-lg` + `rounded-brutal`

* 描述文字 `font-medium`，标题 `font-black tracking-wide`

## 6. 架构与文件布局

### 6.1 Composable 边界（`packages/ui/src/composables/`）

| 文件                          | 职责        | 输入                                    | 输出                                                                                               |
| --------------------------- | --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `useDataTableSort.ts`       | 排序状态与排序函数 | `columns`, `sortable`                 | `sortState`, `toggleSort`, `sortedData(data)`                                                    |
| `useDataTableFilter.ts`     | 全局/列级过滤   | `columns`, `filterable`               | `filterState`, `filteredData(data)`                                                              |
| `useDataTableSelection.ts`  | 行选择与全选    | `selectable`, `rowKey`, `displayData` | `selectedRows`, `isAllSelected`, `isIndeterminate`, `toggleRow`, `toggleAll`, `clearSelection`   |
| `useDataTablePagination.ts` | 分页状态与导航   | `paginated`, `pageSize`, `totalItems` | `currentPage`, `currentPageSize`, `totalPages`, `paginatedData(data)`, `goToPage`, `setPageSize` |

### 6.2 数据流（单向管道）

```
props.data
  → useDataTableFilter.filteredData(data)        // 过滤
  → useDataTableSort.sortedData(filtered)         // 排序
  → useDataTablePagination.paginatedData(sorted)  // 分页
  → useDataTableSelection 锚定 displayData        // 选择范围
  → 模板渲染
```

`useDataTableSelection` 依赖 `displayData`（分页后的数据），接收 `displayData` 作为参数而非内部计算——保持管道单向、composable 之间无环依赖。

### 6.3 DataTable.vue 角色

变为编排层：初始化 4 个 composables、串联管道、渲染模板。约 200–250 行（当前 454 行）。所有 emit 仍在 DataTable.vue 转发（composables 不直接 emit，保持"逻辑纯净、组件负责 IO"）。

### 6.4 Registry 影响

`packages/registry/scripts/component-files.ts` 中 `data-table` 条目需新增 4 个 `composables` 条目（`useDataTableSort` / `useDataTableFilter` / `useDataTableSelection` / `useDataTablePagination`）。`data-table-section` 无变化（无新文件）。

## 7. 测试策略

### 7.1 现有测试保护

`data-table.test.ts` 与 `data-table-section.test.ts` 已有测试覆盖排序、过滤、选择、分页、空态、加载。composable 拆分后这些测试应全部通过不改（行为不变）。若有断言依赖内联 class 字符串，需更新为新 class（属预期改动）。

### 7.2 新增 composable 单测（4 个文件）

| 文件                               | 关键用例                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `useDataTableSort.test.ts`       | 三态切换 asc→desc→null；`sortable: false` 不响应；`column.sortable === false` 跳过；null/undefined 值排到末尾；稳定性     |
| `useDataTableFilter.test.ts`     | 全局过滤大小写不敏感；列级过滤；空字符串跳过；`accessorFn` vs `accessorKey`；多列叠加                                            |
| `useDataTableSelection.test.ts`  | 单选切换；全选/取消全选；indeterminate 状态；`props.data` 变化时清空；跨页选择保留                                              |
| `useDataTablePagination.test.ts` | `totalPages` 计算；`goToPage` 边界（1 / totalPages / 越界夹紧）；`setPageSize` 重置到第 1 页；`paginated: false` 时返回全部 |

每个 composable 测试用 `defineComponent` + `setup` 调用，不挂载 DataTable — 纯逻辑隔离测试。

### 7.3 新增视觉/行为测试（`data-table.test.ts` 扩展）

1. `striped` 默认 true → 偶数行有 `even:bg-brutal-muted/50` class
2. `striped: false` → 无该 class
3. `size="sm"` + `dense` → cell padding 收缩
4. 排序列高亮 → 激活列 `<th>` 含 `bg-brutal-accent`，单元格含 `bg-brutal-accent/20`
5. 分页按钮渲染为 `<button>` 且含 `active:translate-y-[var(--brutal-pressed-offset` class（按压反馈存在）
6. filter 输入框渲染为 `<Input>` 组件（class 含 `inputVariants` 产物特征）
7. 导出按钮渲染为 `<Button>` 组件
8. loading 状态容器无 `backdrop-blur` class
9. selection info bar 含 `bg-brutal-primary text-brutal-primary-foreground`
10. `stickyHeader` → `<thead>` 含 `sticky top-0`

### 7.4 反模式回归测试（防回退）

新增"Neo-Brutalist 合规性"测试块：扫描渲染产物 class 字符串，断言不含：

* `border-2`（主边框位置）

* `backdrop-blur`

* `shadow-md` / `shadow-lg`（非 brutal）

* `border-brutal/` 后接数字（opacity 淡化边框）

* `divide-y-2` / `divide-brutal/`

> 字符串断言较脆，但能防 CI 回归。放在 `data-table.test.ts` 末尾，注释标注"style guard，更新样式时同步"。

### 7.5 DataTableSection 测试

新增：操作区按钮渲染为 `<Button>`；容器含 `shadow-brutal-lg` + `rounded-brutal`；标题区 `border-b-3`。

### 7.6 视觉快照

若 `pnpm release:check` 包含视觉快照，DataTable 改动会触发快照 diff — 预期更新 baseline。实施计划中标注。

### 7.7 Registry 校验

新增 4 个 composable 文件后，运行 `pnpm --filter brutx-registry-vue validate` 确认三道一致性校验通过。

## 8. 实施顺序（建议）

1. 写 4 个 composable + 单测（不改 DataTable.vue）→ 跑 composable 测试
2. 改 `data-table-variants.ts`（CVA 改写）
3. 改 `DataTable.vue` 模板：接入 composables、复用 Input/Button、新 props、排序列高亮、loading/empty/selection 重构
4. 改 `DataTableSection.vue` 视觉
5. 登记 registry `component-files.ts` + 跑 `validate`
6. 扩展 `data-table.test.ts` + `data-table-section.test.ts`（视觉/行为 + style guard）
7. 全量门禁：`pnpm release:check`
8. 更新 docs（DataTable 演示页 + 迁移指南注 `striped` 默认值变更）

## 9. 风险与缓解

| 风险                                            | 缓解                                       |
| --------------------------------------------- | ---------------------------------------- |
| composable 拆分引入回归（选择/分页边界）                    | 4 个 composable 各自带单测；现有集成测试不改即应通过        |
| `striped` 默认 true 破坏现有调用方外观                   | 文档迁移指南标注；显式 `:striped="false"` 可还原       |
| style guard 字符串断言脆，未来样式调整会误报                  | 测试注释标注"更新样式时同步"；断言范围限定 DataTable 根容器     |
| 复用 `<Button>` / `<Input>` 引入额外 a11y 属性，可能影响快照 | 预期更新 baseline；a11y 改进属正向                 |
| `bg-brutal-accent/20` 在某些主题下对比度不足             | 实施时手动验证亮/暗主题；若不足改为 `bg-brutal-accent/30` |

## 10. 验收标准

* `pnpm typecheck` 通过

* `pnpm lint` 通过

* `pnpm test` 全部通过（含新增 composable 单测与 style guard）

* `pnpm --filter brutx-registry-vue validate` 通过

* `pnpm release:check` 通过（含视觉快照 baseline 更新）

* 手动验证：亮/暗主题下 DataTable 默认外观符合 Neo-Brutalist 规范；排序列黄色高亮可辨；按压分页按钮有位移；striped 偶数行可辨

