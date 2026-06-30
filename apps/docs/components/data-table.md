---
title: DataTable 数据表格
description: 新粗野主义风格的数据表格组件，支持排序、筛选、选择、分页和虚拟滚动。
---

# DataTable 数据表格

新粗野主义风格的数据表格组件，提供完整的排序、筛选、多选、分页和虚拟滚动功能。支持泛型数据源，通过 `columns` 配置驱动的列定义实现灵活的数据展示。

## 预览

<ComponentPreview>
    <DataTableDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="data-table" />

## 用法

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DataTable } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User {
    id: number
    name: string
    email: string
    role: string
    status: string
}

const columns: DataTableColumn<User>[] = [
    {
        id: 'name',
        header: '姓名',
        accessorKey: 'name',
        sortable: true,
    },
    {
        id: 'email',
        header: '邮箱',
        accessorKey: 'email',
        sortable: true,
    },
    {
        id: 'role',
        header: '角色',
        accessorKey: 'role',
    },
    {
        id: 'status',
        header: '状态',
        accessorKey: 'status',
        align: 'center',
    },
]

const data = ref<User[]>([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '活跃' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: '活跃' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '访客', status: '未激活' },
])
</script>

<template>
    <DataTable
        :data="data"
        :columns="columns"
        :sortable="true"
        row-key="id"
    />
</template>
```

### 启用排序

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :sortable="true"
        row-key="id"
        @sort="handleSort"
    />
</template>
```

通过 `sortable` 属性启用排序，在列定义中设置 `sortable: false` 可禁用特定列的排序。点击表头可在升序 / 降序 / 默认 之间切换。

### 启用筛选

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :filterable="true"
        row-key="id"
        @filter="handleFilter"
    />
</template>
```

启用 `filterable` 后，表格上方会显示全局搜索输入框，对所有可见列进行模糊匹配。

### 启用选择

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :selectable="true"
        row-key="id"
        @select="handleSelect"
    />
</template>
```

启用 `selectable` 后，每行左侧会显示复选框，表头复选框支持全选 / 取消全选。选中行后底部会显示已选行数，并可导出 CSV。

### 启用分页

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :paginated="true"
        :page-size="10"
        :page-size-options="[10, 20, 50]"
        row-key="id"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
    />
</template>
```

分页器包含首页、上一页、下一页、末页按钮，以及每页条数选择器。

### 自定义单元格

```vue
<script setup lang="ts">
import { h } from 'vue'
import { Badge } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: '姓名', accessorKey: 'name' },
    {
        id: 'status',
        header: '状态',
        accessorKey: 'status',
        cell: ({ value }) => {
            return h(Badge, { variant: value === '活跃' ? 'success' : 'danger' }, () => String(value))
        },
    },
]
</script>
```

通过 `cell` 函数可自定义单元格渲染，支持返回 VNode 或字符串。也可使用具名插槽 `#cell-{columnId}` 进行渲染。

### 使用插槽

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        row-key="id"
    >
        <template #cell-status="{ row, value }">
            <Badge :variant="value === '活跃' ? 'success' : 'danger'">
                {{ value }}
            </Badge>
        </template>

        <template #toolbar>
            <Button variant="primary" size="sm">
                添加用户
            </Button>
        </template>

        <template #empty>
            <div class="text-center py-8">
                <p class="text-lg font-bold">暂无数据</p>
                <p class="text-sm text-brutal-fg/60">点击上方按钮添加第一条记录</p>
            </div>
        </template>
    </DataTable>
</template>
```

### 加载状态

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
    />
</template>
```

设置 `loading` 为 `true` 时，表格上方会显示旋转加载动画遮罩。也可通过 `loading` 具名插槽自定义加载态内容。

## 尺寸

```vue
<template>
    <!-- 小尺寸 + 紧凑密度，适合信息密集型表格 -->
    <DataTable
        :data="data"
        :columns="columns"
        :sortable="true"
        size="sm"
        :dense="true"
        row-key="id"
    />

    <!-- 大尺寸，适合展示型表格 -->
    <DataTable
        :data="data"
        :columns="columns"
        size="lg"
        row-key="id"
    />
</template>
```

`size` 控制字体大小与单元格纵向 padding（`sm` → `py-2`、`default` → `py-3`、`lg` → `py-4`）；`dense` 进一步压缩行高至 `py-1.5`，与 `size` 正交，可单独或组合使用。

### 条纹控制

```vue
<template>
    <!-- 默认开启条纹（偶数行 bg-brutal-muted/50） -->
    <DataTable
        :data="data"
        :columns="columns"
        row-key="id"
    />

    <!-- 显式关闭条纹 -->
    <DataTable
        :data="data"
        :columns="columns"
        :striped="false"
        row-key="id"
    />
</template>
```

`striped` 默认 `true`，偶数行应用 `bg-brutal-muted/50` 形成奇偶交替。若需要纯净外观或配合自定义行背景，可设为 `false`。

### 粘性表头

```vue
<template>
    <DataTable
        :data="largeData"
        :columns="columns"
        :sticky-header="true"
        row-key="id"
    />
</template>
```

启用 `stickyHeader` 后，`<thead>` 会添加 `sticky top-0 z-10`，在长表格垂直滚动时表头始终可见。建议配合固定高度的滚动容器使用。

## 数据类型

### DataTableColumn

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 列唯一标识，必填 |
| `header` | `string \| ((ctx: DataTableColumnHeaderContext) => string)` | 列标题，必填；函数形式接收 `DataTableColumnHeaderContext` 上下文 |
| `accessorKey` | `keyof T & string` | 通过 key 访问行数据字段 |
| `accessorFn` | `(row: T) => unknown` | 通过函数访问行数据值 |
| `cell` | `(props: { row: T; value: unknown }) => VNode \| string` | 自定义单元格渲染 |
| `sortable` | `boolean` | 是否可排序，默认 `true` |
| `hidden` | `boolean` | 是否隐藏 |
| `width` | `number \| 'auto'` | 列宽度 |
| `minWidth` | `number` | 最小宽度 |
| `maxWidth` | `number` | 最大宽度 |
| `align` | `'left' \| 'center' \| 'right'` | 对齐方式 |

### DataTableColumnHeaderContext

`header` 回调函数接收的上下文对象，用于在函数式表头中获取列的运行时状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 当前列的 ID |
| `sortable` | `boolean` | 当前列是否可排序 |
| `direction` | `'asc' \| 'desc' \| null` | 当前列的排序方向（`null` 表示未排序） |
| `accessorKey` | `PropertyKey` | 当前列的 accessorKey（如果有） |
| `align` | `'left' \| 'center' \| 'right'` | 当前列的对齐方式 |

### DataTableVirtualScroll

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | — | 是否启用虚拟滚动 |
| `rowHeight` | `number` | `48` | 每行预估高度（像素） |

### DataTableFilterState

| 字段 | 类型 | 说明 |
|------|------|------|
| `global` | `string` | 全局筛选关键字 |
| `columns` | `Record<string, string>` | 按列 ID 索引的列级筛选值 |

## 程序化控制

DataTable 通过 `defineExpose` 暴露了排序、筛选、选择、分页四组方法与状态，可通过组件 `ref` 在父组件中直接调用，实现"工具栏外置"、"外部按钮触发排序"、"批量操作按钮"等场景。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, Button } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User {
    id: number
    name: string
    email: string
    role: string
    status: string
}

const tableRef = ref<InstanceType<typeof DataTable> | null>(null)

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: '姓名', accessorKey: 'name', sortable: true },
    { id: 'email', header: '邮箱', accessorKey: 'email' },
    { id: 'role', header: '角色', accessorKey: 'role' },
    { id: 'status', header: '状态', accessorKey: 'status' },
]

const data: User[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '活跃' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: '未激活' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '访客', status: '活跃' },
]

// 程序化触发按 name 升序
function sortByNameAsc() {
    tableRef.value?.sort.toggleSort('name')
}

// 程序化设置全局筛选关键字
function filterByAdmin() {
    tableRef.value?.filter.setGlobalFilter('管理员')
}

// 全选当前页
function selectAll() {
    tableRef.value?.selection.toggleAllRows()
}

// 跳转到下一页
function goNextPage() {
    tableRef.value?.pagination.nextPage()
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="primary" size="sm" @click="sortByNameAsc">按姓名排序</Button>
        <Button variant="default" size="sm" @click="filterByAdmin">筛选"管理员"</Button>
        <Button variant="default" size="sm" @click="selectAll">全选当前页</Button>
        <Button variant="default" size="sm" @click="goNextPage">下一页</Button>
    </div>

    <DataTable
        ref="tableRef"
        :data="data"
        :columns="columns"
        :sortable="true"
        :filterable="true"
        :selectable="true"
        :paginated="true"
        :page-size="2"
        row-key="id"
    />
</template>
```

### 暴露的 API

通过 `ref` 访问 `tableRef` 后，可使用以下四组命名空间：

#### sort

| 成员 | 类型 | 说明 |
|------|------|------|
| `toggleSort(columnId)` | `(columnId: string) => void` | 切换指定列的排序方向，循环顺序为 `asc → desc → 取消` |
| `sortState` | `Ref<{ column: string; direction: 'asc' \| 'desc' \| null }>` | 当前排序状态（响应式） |

#### filter

| 成员 | 类型 | 说明 |
|------|------|------|
| `setGlobalFilter(value)` | `(value: string) => void` | 设置全局筛选关键字 |
| `filterState` | `Ref<DataTableFilterState>` | 当前筛选状态（响应式），包含 `global` 字段 |

#### selection

| 成员 | 类型 | 说明 |
|------|------|------|
| `toggleRow(row)` | `(row: T) => void` | 切换指定行的选中状态 |
| `toggleAllRows()` | `() => void` | 切换当前页全选 / 取消全选 |
| `clearSelection()` | `() => void` | 清空所有选中行 |
| `getSelectedRows()` | `() => T[]` | 获取当前选中的完整行数据数组 |
| `selectedRows` | `Ref<Set<string \| number>>` | 选中行的 key 集合（响应式） |
| `isAllSelected` | `ComputedRef<boolean>` | 当前页是否全选 |

#### pagination

| 成员 | 类型 | 说明 |
|------|------|------|
| `goToPage(page)` | `(page: number) => boolean` | 跳转到指定页码，返回是否实际切换 |
| `nextPage()` | `() => void` | 跳转到下一页 |
| `previousPage()` | `() => void` | 跳转到上一页 |
| `setPageSize(size)` | `(size: number) => void` | 设置每页条数（会重置到第 1 页） |
| `pageIndex` | `Ref<number>` | 当前页码（响应式，从 1 开始） |
| `pageCount` | `ComputedRef<number>` | 总页数（响应式） |

> 注意：程序化调用 `toggleSort` / `setGlobalFilter` / `toggleRow` 等方法**不会**自动触发 `sort` / `filter` / `select` 事件。如需同步通知父组件，请自行监听对应状态变化或显式调用后处理。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `T[]` | —（必填） | 表格数据源 |
| `columns` | `DataTableColumn<T>[]` | —（必填） | 列定义配置 |
| `rowKey` | `keyof T \| ((row: T) => string \| number)` | —（必填） | 行唯一标识，用于选择和虚拟滚动 |
| `sortable` | `boolean` | `false` | 是否启用排序 |
| `filterable` | `boolean` | `false` | 是否启用筛选 |
| `selectable` | `boolean` | `false` | 是否启用行选择 |
| `paginated` | `boolean` | `false` | 是否启用分页 |
| `pageSize` | `number` | `10` | 每页显示条数 |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | 每页条数选项 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `emptyMessage` | `string` | locale: `dataTable.noData` | 数据为空时的提示信息 |
| `virtualScroll` | `DataTableVirtualScroll` | — | 虚拟滚动配置 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 表格尺寸 |
| `dense` | `boolean` | `false` | 是否启用紧凑密度 |
| `striped` | `boolean` | `true` | 是否显示条纹 |
| `stickyHeader` | `boolean` | `false` | 是否启用粘性表头 |
| `expandable` | `boolean` | `false` | 是否启用展开行 |
| `expandRowKeys` | `Set<string \| number>` | — | 受控的展开行 key 集合 |
| `spanMethod` | `(params) => [number, number] \| void` | — | 单元格合并方法，返回 `[rowspan, colspan]` |
| `class` | `string` | — | 自定义 CSS 类名 |

### DataTableColumn 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | —（必填） | 列唯一标识 |
| `header` | `string \| ((ctx) => string)` | —（必填） | 列头文本或渲染函数 |
| `accessorKey` | `keyof T & string` | — | 数据字段键 |
| `accessorFn` | `(row: T) => unknown` | — | 自定义取值函数 |
| `cell` | `(props) => VNode \| string` | — | 自定义单元格渲染函数 |
| `sortable` | `boolean` | — | 该列是否可排序 |
| `hidden` | `boolean` | — | 是否隐藏该列 |
| `width` | `number \| 'auto'` | — | 列宽 |
| `minWidth` | `number` | — | 最小列宽 |
| `maxWidth` | `number` | — | 最大列宽 |
| `align` | `'left' \| 'center' \| 'right'` | — | 列内容对齐方式 |
| `fixed` | `'left' \| 'right'` | — | 固定列方向 |
| `type` | `'default' \| 'expand'` | `'default'` | 列类型（`expand` 为展开列） |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `sort` | `[column: string, direction: 'asc' \| 'desc' \| null]` | 排序变化时触发 |
| `filter` | `[filters: DataTableFilterState]` | 筛选条件变化时触发 |
| `select` | `[rows: T[]]` | 选中行变化时触发 |
| `page-change` | `[page: number]` | 页码变化时触发 |
| `page-size-change` | `[size: number]` | 每页条数变化时触发 |
| `expand-change` | `[row: T, expanded: boolean]` | 行展开状态变化时触发 |
| `export` | `[format: 'csv' \| 'json', selectedRows?: T[]]` | 导出操作触发，携带选中行数据（需启用 selectable） |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `toolbar` | — | 工具栏区域，位于筛选框右侧 |
| `cell-{columnId}` | `{ row: T; value: unknown }` | 自定义特定列的单元格渲染 |
| `expanded-row` | `{ row: T; index: number }` | 自定义展开行内容 |
| `empty` | — | 数据为空时的自定义空状态 |
| `loading` | — | 自定义加载态内容，仅在 `loading` 为 `true` 时渲染 |

## 可访问性

DataTable 组件遵循 WAI-ARIA 表格模式，提供以下可访问性支持：

- 使用语义化的 `<table>`、`<thead>`、`<tbody>`、`<tr>`、`<th>`、`<td>` 元素
- 排序状态通过 `aria-sort` 属性通知屏幕阅读器
- 选择状态通过 `aria-selected` 属性标记选中行
- 筛选输入框和分页控件均提供适当的 `aria-label`
- 支持键盘导航：Tab 键在交互元素间切换，Enter/Space 键触发排序和选择

## 常见问题

**Q: 为什么设置了 `selectable` 但选中状态没有生效？**

A: 请确保正确设置了 `row-key` 属性。`row-key` 用于标识每一行的唯一性，选择功能依赖它来追踪选中行。如果没有提供 `row-key`，选择功能将无法正常工作。建议使用数据中具有唯一性的字段，如 `id`。

**Q: 同时启用排序、筛选和分页时，它们之间的执行顺序是什么？**

A: 组件内部按"筛选 → 排序 → 分页"的顺序处理数据。即先根据筛选条件过滤数据，再对过滤后的结果进行排序，最后进行分页。如果同时使用了程序化 API（如 `setGlobalFilter` 和 `toggleSort`），也会遵循相同的处理顺序。

**Q: 数据量很大时如何优化表格性能？**

A: 当数据量超过数百行时，建议启用虚拟滚动功能。通过配置 `:virtual-scroll="{ enabled: true }"` 属性，表格将只渲染可视区域内的行，大幅减少 DOM 节点数量。同时可以设置 `:dense="true"` 来压缩行高，进一步提升可视区域内的信息密度。
