# 性能审计报告（§4.2）

> 审计时间：2026-07-17
> 审计范围：DataTable、TreeView、VirtualScroll、Cascader
> 基准数据来源：`pnpm --filter brutx-ui-vue bench`（详见 §4.1）

## 基准数据汇总

| 组件 | 场景 | hz | 说明 |
| --- | --- | --- | --- |
| DataTable | 100 rows | 30.53 | 小列表基线 |
| DataTable | 1000 rows | 3.32 | 大列表观测点 |
| TreeView | 100 nodes | 9.11 | 小列表基线 |
| TreeView | 1000 nodes | 1.02 | 大列表观测点 |

> VirtualScroll 和 Cascader 未建立 bench 基准：VirtualScroll 仅渲染可见项（~20），Cascader 列数有限（2–4 列），均非性能瓶颈点。

---

## DataTable.vue 性能审计

### 现状

- **shallowRef 使用**：有
  - `expandedRowKeys`（`shallowRef<Set<string | number>>`）——避免对 Set 进行深层响应式转换 ✅
- **markRaw 使用**：有
  - `CellRenderer`（`markRaw({ ... })`）——避免组件对象被响应式代理 ✅
- **v-memo 使用**：无
  - 行渲染 `v-for="(row, rowIndex) in displayData"`（[DataTable.vue:668](../../packages/ui/src/components/data-table/DataTable.vue#L668)）未配套 `v-memo`
- **bench 基线**：100 rows = 30.53 hz, 1000 rows = 3.32 hz

### 优化候选

1. **候选项：为行 `<template v-for>` 添加 `v-memo`**
   - 依赖数组候选：`[selection.selectedRows.value.has(selection.getRowKey(row)), isRowExpanded(row), getRowClasses(row)]`
   - 预期收益：1000 rows 选中/展开单行时，避免全表 re-render，hz 预计提升 30–50%
   - 风险：
     - 依赖数组需覆盖所有影响行渲染的状态（选中态、展开态、行类名、单元格合并）
     - `getCellSpan(rowIndex, columnIndex)` 依赖全局行布局，若某行合并影响其他行，`v-memo` 可能跳过必要的更新
     - `displayData` 排序/筛选变化时，`v-memo` 依赖数组未包含 `row` 本身会导致内容不更新
   - 结论：**暂不采纳**——依赖数组复杂度高，遗漏风险大。需先重构行渲染逻辑，将状态依赖收敛后再引入 `v-memo`

2. **候选项：`displayData` 使用 `shallowRef`**
   - 当前 `displayData` 是 `computed`，每次排序/筛选返回新数组
   - `shallowRef` 无法替代 `computed`（需要响应式依赖追踪）
   - 结论：**不采纳**——`computed` 是正确的响应式模式

### 结论

DataTable 已合理使用 `shallowRef`（Set 状态）和 `markRaw`（渲染器对象）。`v-memo` 暂不引入——行渲染状态依赖复杂，盲目添加会导致渲染错误。若后续 1000 rows 场景出现性能问题，优先考虑启用 `virtualScroll` prop（组件已内置虚拟滚动支持）。

---

## TreeView.vue 性能审计

### 现状

- **shallowRef 使用**：有
  - `expandedIds`（`shallowRef<Set<string>>`）——避免对 Set 进行深层响应式转换 ✅
- **markRaw 使用**：无
- **v-memo 使用**：无
  - 节点渲染 `v-for="(node, index) in localNodes"`（[TreeView.vue:458](../../packages/ui/src/components/tree-view/TreeView.vue#L458)）未配套 `v-memo`
- **bench 基线**：100 nodes = 9.11 hz, 1000 nodes = 1.02 hz

### 优化候选

1. **候选项：为 `<TreeViewNode v-for>` 添加 `v-memo`**
   - 依赖数组候选：`[node, expandedIds.value.has(node.id), modelValue === node.id, checkedIds.includes(node.id)]`
   - 预期收益：1000 nodes 展开/选中单节点时，避免全树 re-render，hz 预计提升 40–60%
   - 风险：
     - `TreeViewNode` 是递归组件，子节点展开状态变化时父节点需更新 `aria-expanded`
     - `expandedIds` 是 `shallowRef`，`v-memo` 依赖数组读取 `.value.has()` 能正确触发依赖追踪
     - 拖拽状态（`draggedNode`/`dragOverNode`/`dropType`）需纳入依赖数组，否则拖拽视觉反馈不更新
   - 结论：**暂不采纳**——递归组件 + 拖拽状态使依赖数组难以完备。建议先 bench 验证拖拽场景的瓶颈点

2. **候选项：`localNodes` 使用 `markRaw` 递归标记**
   - 当前 `localNodes` 是 `ref`，深层节点对象会被响应式代理
   - 树节点数据通常不需要响应式（仅展开/选中状态变化）
   - 风险：`markRaw` 后节点数据变更不会触发视图更新，需 `triggerRef` 手动触发
   - 结论：**暂不采纳**——`localNodes` 支持拖拽排序（`update:nodes` 事件），`markRaw` 会破坏排序后的响应式更新

### 结论

TreeView 已对 `expandedIds` Set 使用 `shallowRef`。`v-memo` 暂不引入——递归组件 + 拖拽状态使依赖数组复杂。1000 nodes = 1.02 hz 是可接受的基线（TreeView 通常用于 < 500 节点的文件树场景）。

---

## VirtualScroll.vue 性能审计

### 现状

- **shallowRef 使用**：有
  - `virtualizerRef`（`shallowRef<VirtualizerInstance | null>`）——虚拟化器实例无需深层响应式 ✅
- **markRaw 使用**：无
  - `virtualizer` 实例来自 `@tanstack/vue-virtual`，已是第三方实例
- **v-memo 使用**：无
  - 可见项渲染 `v-for="virtualRow in virtualItems"`（[VirtualScroll.vue:201](../../packages/ui/src/components/virtual-scroll/VirtualScroll.vue#L201)）未配套 `v-memo`
- **bench 基线**：未建立——VirtualScroll 仅渲染可见项（默认 ~20 项），非性能瓶颈

### 优化候选

1. **候选项：为可见项 `<div v-for>` 添加 `v-memo`**
   - 依赖数组候选：`[virtualRow.index, virtualRow.start, virtualRow.size, items[virtualRow.index]]`
   - 预期收益：极低——可见项仅 ~20 个，re-render 成本可忽略
   - 结论：**不采纳**——v-memo 的依赖追踪开销可能抵消收益

### 结论

VirtualScroll 设计合理：仅渲染可见项 + `shallowRef` 持有虚拟化器实例。无需额外优化。

---

## Cascader.vue 性能审计

### 现状

- **shallowRef 使用**：无
- **markRaw 使用**：无
- **v-memo 使用**：无
  - 列渲染 `v-for="(col, colIdx) in columns"`（[Cascader.vue:526](../../packages/ui/src/components/cascader/Cascader.vue#L526)）
  - 选项渲染 `v-for="(option, optIdx) in col"`（[Cascader.vue:532](../../packages/ui/src/components/cascader/Cascader.vue#L532)）
- **bench 基线**：未建立——Cascader 列数有限（2–4 列），每列选项通常 < 100，非性能瓶颈

### 优化候选

1. **候选项：`props.options` 使用 `markRaw`**
   - 选项树来自父组件，深层节点会被响应式代理
   - 风险：`markRaw` 需在父组件侧调用，且选项数据变更不会触发更新
   - 结论：**不采纳**——选项数据由父组件控制，库组件不应修改传入 props 的响应式性质

2. **候选项：为选项 `<div v-for>` 添加 `v-memo`**
   - 依赖数组候选：`[option.value, isOptionSelected(option, colIdx), isOptionOnTrail(option, colIdx)]`
   - 预期收益：低——每列选项通常 < 100，且列切换时整列重建
   - 结论：**不采纳**——选项列表规模小，v-memo 开销不划算

### 结论

Cascader 列数和选项规模有限，当前实现无性能瓶颈。`columns` 是 `computed`，在 `activePath` 变化时正确重建，无需额外优化。

---

## 汇总结论

| 组件 | shallowRef | markRaw | v-memo | 优化建议 |
| --- | --- | --- | --- | --- |
| DataTable | ✅ expandedRowKeys | ✅ CellRenderer | ❌ | 暂不引入 v-memo（状态依赖复杂），优先用 virtualScroll prop |
| TreeView | ✅ expandedIds | ❌ | ❌ | 暂不引入 v-memo（递归+拖拽），500 节点内性能可接受 |
| VirtualScroll | ✅ virtualizerRef | ❌ | ❌ | 无需优化（仅渲染可见项） |
| Cascader | ❌ | ❌ | ❌ | 无需优化（列数和选项规模有限） |

**总体结论**：4 个关键组件已合理使用 `shallowRef` 持有 Set/实例状态。`v-memo` 暂不引入——每个候选的依赖数组复杂度高（选中态 + 展开态 + 拖拽态 + 单元格合并），盲目添加会导致渲染错误。若后续出现性能回归，应先重构状态依赖结构，再以 bench 数据支撑引入 `v-memo`。
