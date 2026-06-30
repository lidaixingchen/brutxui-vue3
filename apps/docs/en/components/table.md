---
title: Table
description: Data table with high-contrast headers, zebra-striped rows, and hard-edge grid lines.
translated: true
---

# Table

Neo-brutalist data table with 8 composable sub-components for structured tabular data display. Built on native HTML table elements, supporting header variants, footer variants, and accessibility labels.

## Demo

<ComponentPreview>
  <TableDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="table" />

## Usage

```vue
<script setup>
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption, TableFooter } from 'brutx-ui-vue'
</script>

<template>
    <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead class="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Amount</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell class="font-medium">INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell class="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
                <TableCell class="font-medium">INV002</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell class="text-right">$150.00</TableCell>
            </TableRow>
        </TableBody>
        <TableFooter>
            <TableRow>
                <TableCell colspan="2">Total</TableCell>
                <TableCell class="text-right">$400.00</TableCell>
            </TableRow>
        </TableFooter>
    </Table>
</template>
```

## Sub-components

| Component | Description |
|------|------|
| `Table` | Root table container with border and shadow |
| `TableHeader` | Header area (`<thead>`) |
| `TableBody` | Body area (`<tbody>`) |
| `TableFooter` | Footer area (`<tfoot>`) |
| `TableRow` | Table row (`<tr>`) with bottom border |
| `TableHead` | Header cell (`<th>`) with bold text |
| `TableCell` | Data cell (`<td>`) |
| `TableCaption` | Table caption (`<caption>`) |

## Props

### Common Props

All sub-components accept:

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom CSS class |

### Table

| Prop | Type | Default | Description |
|------|------|--------|------|
| `ariaLabel` | `string` | — | Accessible name for the table, used by screen readers |
| `class` | `string` | — | Custom CSS class |

### TableHeader / TableHead

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | Header color variant |
| `class` | `string` | — | Custom CSS class |

### TableFooter

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | Footer color variant |
| `class` | `string` | — | Custom CSS class |

## Accessibility

- **ARIA Attributes**: Use `ariaLabel` to provide a readable name for the table, helping screen readers identify the table's purpose. This is especially important for tables without a visible caption (`TableCaption`). `ariaLabel` only applies to the `Table` root component.

```vue
<script setup>
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'brutx-ui-vue'
</script>

<template>
    <Table ariaLabel="Recent invoices list">
        <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell>Invoice #001</TableCell>
                <TableCell>$250.00</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
```

- **Semantic Markup**: Uses native `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<th>`, `<td>`, `<caption>` elements to ensure assistive technologies correctly parse the table structure.
