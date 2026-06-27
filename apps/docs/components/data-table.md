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

## 启用排序

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

## 启用筛选

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

## 启用选择

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

## 启用分页

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

## 自定义单元格

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

## 使用插槽

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

## 加载状态

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

设置 `loading` 为 `true` 时，表格上方会显示旋转加载动画遮罩。

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `data` | `T[]` | —（必填） |
| `columns` | `DataTableColumn<T>[]` | —（必填） |
| `rowKey` | `keyof T \| ((row: T) => string \| number)` | —（必填） |
| `sortable` | `boolean` | `false` |
| `filterable` | `boolean` | `false` |
| `selectable` | `boolean` | `false` |
| `resizable` | `boolean` | `false` |
| `paginated` | `boolean` | `false` |
| `pageSize` | `number` | `10` |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` |
| `loading` | `boolean` | `false` |
| `emptyMessage` | `string` | locale: `dataTable.noData` |
| `virtualScroll` | `DataTableVirtualScroll` | — |
| `class` | `string` | — |

### DataTableColumn 类型

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 列唯一标识，必填 |
| `header` | `string \| ((column: DataTableColumn<T>) => string)` | 列标题，必填 |
| `accessorKey` | `keyof T` | 通过 key 访问行数据字段 |
| `accessorFn` | `(row: T) => unknown` | 通过函数访问行数据值 |
| `cell` | `(props: { row: T; value: unknown }) => VNode \| string` | 自定义单元格渲染 |
| `sortable` | `boolean` | 是否可排序，默认 `true` |
| `filterable` | `boolean` | 是否可筛选 |
| `hidden` | `boolean` | 是否隐藏 |
| `width` | `number \| 'auto'` | 列宽度 |
| `minWidth` | `number` | 最小宽度 |
| `maxWidth` | `number` | 最大宽度 |
| `align` | `'left' \| 'center' \| 'right'` | 对齐方式 |

### DataTableVirtualScroll 类型

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `enabled` | `boolean` | — |
| `rowHeight` | `number` | `48` |
| `overscan` | `number` | — |
| `threshold` | `number` | — |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `sort` | `[column: string, direction: 'asc' \| 'desc' \| null]` | 排序变化时触发 |
| `filter` | `[filters: DataTableFilterState]` | 筛选条件变化时触发 |
| `select` | `[rows: T[]]` | 选中行变化时触发 |
| `pageChange` | `[page: number]` | 页码变化时触发 |
| `pageSizeChange` | `[size: number]` | 每页条数变化时触发 |
| `export` | `[format: 'csv' \| 'json']` | 导出操作触发（需启用 selectable） |

## Slots

| Slot | 作用域 | 用途 |
|------|------|------|
| `toolbar` | — | 工具栏区域，位于筛选框右侧 |
| `cell-{columnId}` | `{ row: T; value: unknown }` | 自定义特定列的单元格渲染 |
| `empty` | — | 数据为空时的自定义空状态 |