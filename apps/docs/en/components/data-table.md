---
title: DataTable
description: Neo-Brutalist data table component supporting sorting, filtering, selection, pagination, and virtual scrolling.
translated: true
---

# DataTable

A Neo-Brutalist data table component providing comprehensive sorting, filtering, multi-selection, pagination, and virtual scrolling functionality. Supports generic data sources with flexible data presentation through `columns`-driven column configuration.

## Demo

<ComponentPreview>
    <DataTableDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="data-table" />

## Usage

### Basic Usage

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
        header: 'Name',
        accessorKey: 'name',
        sortable: true,
    },
    {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        sortable: true,
    },
    {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
    },
    {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        align: 'center',
    },
]

const data = ref<User[]>([
    { id: 1, name: 'John', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', role: 'Editor', status: 'Active' },
    { id: 3, name: 'Bob', email: 'bob@example.com', role: 'Guest', status: 'Inactive' },
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

### Enabling Sorting

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

Enable sorting via the `sortable` prop. Set `sortable: false` in column definitions to disable sorting for specific columns. Clicking the header toggles between ascending / descending / default.

### Enabling Filtering

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

Enabling `filterable` displays a global search input above the table, performing fuzzy matching across all visible columns.

### Enabling Selection

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

Enabling `selectable` displays checkboxes on the left side of each row. The header checkbox supports select all / deselect all. When rows are selected, the bottom displays the count of selected rows with CSV export capability.

### Enabling Pagination

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

The paginator includes first page, previous page, next page, last page buttons, and a page size selector.

### Custom Cell Rendering

```vue
<script setup lang="ts">
import { h } from 'vue'
import { Badge } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
    {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ value }) => {
            return h(Badge, { variant: value === 'Active' ? 'success' : 'danger' }, () => String(value))
        },
    },
]
</script>
```

The `cell` function enables custom cell rendering, supporting VNode or string return values. You can also use named slots `#cell-{columnId}` for rendering.

### Using Slots

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        row-key="id"
    >
        <template #cell-status="{ row, value }">
            <Badge :variant="value === 'Active' ? 'success' : 'danger'">
                {{ value }}
            </Badge>
        </template>

        <template #toolbar>
            <Button variant="primary" size="sm">
                Add User
            </Button>
        </template>

        <template #empty>
            <div class="text-center py-8">
                <p class="text-lg font-bold">No Data</p>
                <p class="text-sm text-brutal-fg/60">Click the button above to add your first record</p>
            </div>
        </template>
    </DataTable>
</template>
```

### Loading State

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

When `loading` is `true`, a spinning loader overlay appears above the table. You can also customize loading content via the `loading` named slot.

## Sizes

```vue
<template>
    <!-- Small size + compact density, ideal for information-dense tables -->
    <DataTable
        :data="data"
        :columns="columns"
        :sortable="true"
        size="sm"
        :dense="true"
        row-key="id"
    />

    <!-- Large size, ideal for display-oriented tables -->
    <DataTable
        :data="data"
        :columns="columns"
        size="lg"
        row-key="id"
    />
</template>
```

`size` controls font size and vertical cell padding (`sm` -> `py-2`, `default` -> `py-3`, `lg` -> `py-4`); `dense` further compresses row height to `py-1.5`, orthogonal to `size`, and can be used independently or in combination.

### Stripe Control

```vue
<template>
    <!-- Stripes enabled by default (even rows bg-brutal-muted/50) -->
    <DataTable
        :data="data"
        :columns="columns"
        row-key="id"
    />

    <!-- Explicitly disable stripes -->
    <DataTable
        :data="data"
        :columns="columns"
        :striped="false"
        row-key="id"
    />
</template>
```

`striped` defaults to `true`, applying `bg-brutal-muted/50` to even rows for alternating row colors. Set to `false` for a clean appearance or when using custom row backgrounds.

### Sticky Header

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

Enabling `stickyHeader` adds `sticky top-0 z-10` to `<thead>`, keeping the header always visible during vertical scrolling of long tables. Recommended for use with a fixed-height scroll container.

## Data Types

### DataTableColumn

| Field | Type | Description |
|------|------|------|
| `id` | `string` | Column unique identifier, required |
| `header` | `string \| ((ctx: DataTableColumnHeaderContext) => string)` | Column header, required; function form receives `DataTableColumnHeaderContext` context |
| `accessorKey` | `keyof T & string` | Access row data field by key |
| `accessorFn` | `(row: T) => unknown` | Access row data value by function |
| `cell` | `(props: { row: T; value: unknown }) => VNode \| string` | Custom cell rendering |
| `sortable` | `boolean` | Whether sortable, defaults to `true` |
| `hidden` | `boolean` | Whether hidden |
| `width` | `number \| 'auto'` | Column width |
| `minWidth` | `number` | Minimum width |
| `maxWidth` | `number` | Maximum width |
| `align` | `'left' \| 'center' \| 'right'` | Alignment |

### DataTableColumnHeaderContext

Context object received by the `header` callback function, used to access the column's runtime state in functional headers.

| Field | Type | Description |
|------|------|------|
| `id` | `string` | Current column ID |
| `sortable` | `boolean` | Whether the current column is sortable |
| `direction` | `'asc' \| 'desc' \| null` | Current column sort direction (`null` means unsorted) |
| `accessorKey` | `PropertyKey` | Current column's accessorKey (if any) |
| `align` | `'left' \| 'center' \| 'right'` | Current column's alignment |

### DataTableVirtualScroll

| Field | Type | Default | Description |
|------|------|--------|------|
| `enabled` | `boolean` | — | Whether to enable virtual scrolling |
| `rowHeight` | `number` | `48` | Estimated row height (pixels) |

### DataTableFilterState

| Field | Type | Description |
|------|------|------|
| `global` | `string` | Global filter keyword |
| `columns` | `Record<string, string>` | Column-level filter values indexed by column ID |

## Programmatic Control

DataTable exposes sorting, filtering, selection, and pagination methods and state via `defineExpose`. These can be called directly from the parent component through a component `ref`, enabling scenarios like "external toolbars", "external sort triggers", and "batch operation buttons".

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
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    { id: 'role', header: 'Role', accessorKey: 'role' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
]

const data: User[] = [
    { id: 1, name: 'John', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', role: 'Editor', status: 'Inactive' },
    { id: 3, name: 'Bob', email: 'bob@example.com', role: 'Guest', status: 'Active' },
]

// Programmatically sort by name ascending
function sortByNameAsc() {
    tableRef.value?.sort.toggleSort('name')
}

// Programmatically set global filter keyword
function filterByAdmin() {
    tableRef.value?.filter.setGlobalFilter('Admin')
}

// Select all on current page
function selectAll() {
    tableRef.value?.selection.toggleAllRows()
}

// Go to next page
function goNextPage() {
    tableRef.value?.pagination.nextPage()
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="primary" size="sm" @click="sortByNameAsc">Sort by Name</Button>
        <Button variant="default" size="sm" @click="filterByAdmin">Filter "Admin"</Button>
        <Button variant="default" size="sm" @click="selectAll">Select All on Page</Button>
        <Button variant="default" size="sm" @click="goNextPage">Next Page</Button>
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

### Exposed API

After accessing `tableRef` via `ref`, you can use the following four namespaces:

#### sort

| Member | Type | Description |
|------|------|------|
| `toggleSort(columnId)` | `(columnId: string) => void` | Toggle sort direction for the specified column; cycle order is `asc -> desc -> cancel` |
| `sortState` | `Ref<{ column: string; direction: 'asc' \| 'desc' \| null }>` | Current sort state (reactive) |

#### filter

| Member | Type | Description |
|------|------|------|
| `setGlobalFilter(value)` | `(value: string) => void` | Set global filter keyword |
| `filterState` | `Ref<DataTableFilterState>` | Current filter state (reactive), includes `global` field |

#### selection

| Member | Type | Description |
|------|------|------|
| `toggleRow(row)` | `(row: T) => void` | Toggle selection state of the specified row |
| `toggleAllRows()` | `() => void` | Toggle select all / deselect all on the current page |
| `clearSelection()` | `() => void` | Clear all selected rows |
| `getSelectedRows()` | `() => T[]` | Get the full row data array of currently selected rows |
| `selectedRows` | `Ref<Set<string \| number>>` | Set of selected row keys (reactive) |
| `isAllSelected` | `ComputedRef<boolean>` | Whether all rows on the current page are selected |

#### pagination

| Member | Type | Description |
|------|------|------|
| `goToPage(page)` | `(page: number) => boolean` | Navigate to the specified page number; returns whether the switch actually occurred |
| `nextPage()` | `() => void` | Go to the next page |
| `previousPage()` | `() => void` | Go to the previous page |
| `setPageSize(size)` | `(size: number) => void` | Set the number of items per page (resets to page 1) |
| `pageIndex` | `Ref<number>` | Current page number (reactive, starts from 1) |
| `pageCount` | `ComputedRef<number>` | Total number of pages (reactive) |

> Note: Programmatic calls to `toggleSort` / `setGlobalFilter` / `toggleRow` and similar methods do **not** automatically trigger the `sort` / `filter` / `select` events. If you need to notify the parent component, monitor the corresponding state changes or handle them explicitly after calling.

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `data` | `T[]` | — (required) | Table data source |
| `columns` | `DataTableColumn<T>[]` | — (required) | Column definition configuration |
| `rowKey` | `keyof T \| ((row: T) => string \| number)` | — (required) | Row unique identifier, used for selection and virtual scrolling |
| `sortable` | `boolean` | `false` | Whether to enable sorting |
| `filterable` | `boolean` | `false` | Whether to enable filtering |
| `selectable` | `boolean` | `false` | Whether to enable row selection |
| `paginated` | `boolean` | `false` | Whether to enable pagination |
| `pageSize` | `number` | `10` | Number of items per page |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | Page size options |
| `loading` | `boolean` | `false` | Whether to show loading state |
| `emptyMessage` | `string` | locale: `dataTable.noData` | Message displayed when data is empty |
| `virtualScroll` | `DataTableVirtualScroll` | — | Virtual scrolling configuration |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Table size |
| `dense` | `boolean` | `false` | Whether to enable compact density |
| `striped` | `boolean` | `true` | Whether to show stripes |
| `stickyHeader` | `boolean` | `false` | Whether to enable sticky header |
| `class` | `string` | — | Custom CSS class name |

## Events

| Event | Payload | Description |
|------|------|------|
| `sort` | `[column: string, direction: 'asc' \| 'desc' \| null]` | Fired when sort changes |
| `filter` | `[filters: DataTableFilterState]` | Fired when filter criteria change |
| `select` | `[rows: T[]]` | Fired when selected rows change |
| `page-change` | `[page: number]` | Fired when page number changes |
| `page-size-change` | `[size: number]` | Fired when page size changes |
| `export` | `[format: 'csv' \| 'json', selectedRows?: T[]]` | Fired on export operation, carries selected row data (requires selectable) |

## Slots

| Slot | Scope | Description |
|------|------|------|
| `toolbar` | — | Toolbar area, positioned to the right of the filter input |
| `cell-{columnId}` | `{ row: T; value: unknown }` | Custom cell rendering for a specific column |
| `empty` | — | Custom empty state when data is empty |
| `loading` | — | Custom loading content, only rendered when `loading` is `true` |

## Accessibility

The DataTable component follows the WAI-ARIA table pattern, providing the following accessibility support:

- Uses semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` elements
- Sort state communicated to screen readers via `aria-sort` attribute
- Selection state marked via `aria-selected` attribute on selected rows
- Filter inputs and pagination controls provide appropriate `aria-label`
- Keyboard navigation support: Tab key switches between interactive elements, Enter/Space triggers sorting and selection

## FAQ

**Q: Why isn't the selection state working after setting `selectable`?**

A: Ensure the `row-key` prop is correctly set. `row-key` identifies the uniqueness of each row, and the selection feature depends on it to track selected rows. If `row-key` is not provided, selection will not work properly. It is recommended to use a unique field from the data, such as `id`.

**Q: What is the execution order when sorting, filtering, and pagination are all enabled?**

A: The component processes data internally in the order: "filter -> sort -> paginate". That is, data is first filtered by filter criteria, then sorted, and finally paginated. If programmatic APIs (like `setGlobalFilter` and `toggleSort`) are used simultaneously, the same processing order applies.

**Q: How do I optimize table performance with large datasets?**

A: When the data exceeds several hundred rows, it is recommended to enable virtual scrolling. By configuring `:virtual-scroll="{ enabled: true }"`, the table will only render rows within the visible area, significantly reducing DOM node count. You can also set `:dense="true"` to compress row height, further improving information density within the visible area.
