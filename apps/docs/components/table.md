# Table

新粗野主义风格数据表格，包含 8 个可组合子组件，用于结构化表格数据展示。

## 预览

<ComponentPreview>
  <div class="w-full border-3 border-brutal shadow-brutal">
    <table class="w-full caption-bottom text-sm">
      <thead class="border-b-3 border-brutal bg-brutal-muted">
        <tr>
          <th class="h-12 px-4 text-left font-black">Name</th>
          <th class="h-12 px-4 text-left font-black">Status</th>
          <th class="h-12 px-4 text-right font-black">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b-3 border-brutal">
          <td class="p-4 font-medium">Project Alpha</td>
          <td class="p-4"><span class="inline-flex items-center border-3 border-brutal font-bold bg-brutal-success text-brutal-fg shadow-brutal-sm px-2 py-0.5 text-xs">Active</span></td>
          <td class="p-4 text-right font-bold">$2,500</td>
        </tr>
        <tr class="border-b-3 border-brutal">
          <td class="p-4 font-medium">Project Beta</td>
          <td class="p-4"><span class="inline-flex items-center border-3 border-brutal font-bold bg-brutal-accent text-brutal-fg shadow-brutal-sm px-2 py-0.5 text-xs">Pending</span></td>
          <td class="p-4 text-right font-bold">$1,200</td>
        </tr>
      </tbody>
    </table>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="table" />

## 用法

```vue
<script setup>
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableCaption from '@/components/ui/TableCaption.vue'
import TableFooter from '@/components/ui/TableFooter.vue'
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

## 属性

所有子组件均接受：

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |
