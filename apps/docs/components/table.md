---
title: Table 表格
description: 数据表格，拥有高对比度表头、斑马纹行和硬边缘网格线。
---

# Table 表格

新粗野主义风格数据表格，包含 8 个可组合子组件，用于结构化表格数据展示。

## 预览

<ComponentPreview>
  <TableDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="table" />

## 用法

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

## 无障碍标签

通过 `ariaLabel` 为表格提供可读名称，便于屏幕阅读器识别表格用途，对于无可见标题（`TableCaption`）的表格尤为重要。`ariaLabel` 仅作用于 `Table` 根组件。

```vue
<script setup>
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'brutx-ui-vue'
</script>

<template>
    <Table aria-label="近期发票列表">
        <TableHeader>
            <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>金额</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell>发票 #001</TableCell>
                <TableCell>$250.00</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Table` | 根表格容器，带边框和阴影 |
| `TableHeader` | 表头区域（`<thead>`） |
| `TableBody` | 表体区域（`<tbody>`） |
| `TableFooter` | 表尾区域（`<tfoot>`） |
| `TableRow` | 表格行（`<tr>`），带底部边框 |
| `TableHead` | 头部单元格（`<th>`），粗体文字 |
| `TableCell` | 数据单元格（`<td>`） |
| `TableCaption` | 表格标题（`<caption>`） |

## Props

所有子组件均接受：

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### Table

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `ariaLabel` | `string` | — |
| `class` | `string` | — |

### TableHeader / TableHead

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` |
| `class` | `string` | — |

### TableFooter

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` |
| `class` | `string` | — |
