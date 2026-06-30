---
title: Data Table Section
description: 数据表格区块，带有搜索、排序和分页功能。
---

# Data Table Section 数据表格

新粗野主义风格的数据表格区块，包含搜索过滤、列排序和分页功能。

## 预览

<ComponentPreview>
  <DataTableSectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="data-table-section" />

## 用法

```vue
<script setup>
import DataTableSection from '@/components/ui/data-table-section/DataTableSection.vue'
import type { ColumnDef } from '@/components/ui/data-table-section/DataTableSection.vue'

const columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role' },
]

const rows = [
    { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob', email: 'bob@example.com', role: 'User' },
    { name: 'Charlie', email: 'charlie@example.com', role: 'Editor' },
]

function handleRowClick(row: Record<string, unknown>) {
    console.log('Row clicked:', row)
}

function handleSort(payload: { key: string; direction: 'asc' | 'desc' }) {
    console.log('Sort:', payload)
}
</script>

<template>
    <DataTableSection
        title="Users"
        :columns="columns"
        :rows="rows"
        :searchable="true"
        :page-size="10"
        @row-click="handleRowClick"
        @sort="handleSort"
    />
</template>
```

## 变体

### 禁用搜索

```vue
<script setup>
import DataTableSection from '@/components/ui/data-table-section/DataTableSection.vue'
</script>

<template>
    <DataTableSection
        title="Simple Table"
        :columns="columns"
        :rows="rows"
        :searchable="false"
    />
</template>
```

## 数据类型

```ts
interface ColumnDef {
    key: string
    label: string
    sortable?: boolean
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `dataTableSection.defaultTitle` | 区块标题 |
| `columns` | `ColumnDef[]` | `[]` | 列定义 |
| `rows` | `Record<string, unknown>[]` | `[]` | 行数据 |
| `searchable` | `boolean` | `true` | 是否启用搜索 |
| `pageSize` | `number` | `10` | 每页显示行数 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `row-click` | `[row: Record<string, unknown>]` | 行点击时触发，参数为行数据 |
| `sort` | `[{ key: string; direction: 'asc' \| 'desc' }]` | 排序变化时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 替换区块主体内容（含表格和分页） |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

- **键盘操作**：表格行支持 `Tab` 聚焦，`Enter` / `Space` 触发点击；排序按钮支持 `Enter` 切换排序
- **ARIA 属性**：表格使用语义化 `<table>` 标签，排序按钮使用 `aria-sort` 标识当前排序状态
- **焦点管理**：支持键盘导航在表格行和控件间切换焦点
