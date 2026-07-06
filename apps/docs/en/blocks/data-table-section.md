---
title: Data Table Section
description: Data table section with search, sorting, and pagination.
translated: true
---

# Data Table Section

A neo-brutalist data table section featuring search filtering, column sorting, and pagination.

## Demo

<ComponentPreview>
  <DataTableSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="data-table-section" />

## Usage

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

function handleSort(payload: { key: string; direction: 'asc' | 'desc' | null }) {
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

## Variants

### Search Disabled

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

## Data Types

```ts
interface ColumnDef {
    key: string
    label: string
    sortable?: boolean
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `dataTableSection.defaultTitle` | Section title |
| `columns` | `ColumnDef[]` | `[]` | Column definitions |
| `rows` | `Record<string, unknown>[]` | `[]` | Row data |
| `searchable` | `boolean` | `true` | Whether to enable search |
| `pageSize` | `number` | `10` | Number of rows per page |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `row-click` | `[row: Record<string, unknown>]` | Triggered on row click, payload is the row data |
| `sort` | `[{ key: string; direction: 'asc' \| 'desc' \| null }]` | Triggered when sorting changes; `null` means sorting was cleared |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `header` | — | Replace/extend the section header |
| `default` | — | Replace the section body content (including table and pagination) |
| `footer` | — | Replace/extend the section footer |

## Accessibility

- **Keyboard**: Table rows support `Tab` focusing, `Enter` / `Space` to trigger click; sort buttons support `Enter` to toggle sorting
- **ARIA attributes**: Table uses semantic `<table>` tag, sort buttons use `aria-sort` to indicate current sort state
- **Focus management**: Supports keyboard navigation to move focus between table rows and controls
