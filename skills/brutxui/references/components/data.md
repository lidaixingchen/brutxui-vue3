# 数据展示组件

## Table

```vue
<Table>
  <TableHeader>
    <TableRow><TableHead>列 1</TableHead><TableHead>列 2</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>数据 1</TableCell><TableCell>数据 2</TableCell></TableRow>
  </TableBody>
</Table>
```

- `ariaLabel`: `string` — 表格的无障碍标签，透传给 `<table>` 元素的 `aria-label`

子组件：Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption

## Badge

```vue
<Badge variant="success">已完成</Badge>
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="lg">Large</Badge>
```

- `variant`: `'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`
- `closable`: `boolean` — 默认 `false`，渲染 × 关闭按钮
- `dot`: `boolean` — 默认 `false`，渲染小圆点指示器
- `pulse`: `boolean` — 默认 `false`，dot 启用脉冲动画（`animate-brutal-pulse`）

- Events: `close` — 点击关闭按钮时触发
- Slots: `icon` — 在文字前渲染自定义图标；`default` — 徽标内容

## Avatar

```vue
<Avatar size="lg" shape="circle" variant="primary" status="online">
  <AvatarImage src="https://..." />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

- `size`: `'sm' | 'default' | 'lg' | 'xl'`
- `shape`: `'square' | 'circle'`
- `variant`: `'default' | 'primary' | 'secondary' | 'accent'` — 默认 `'default'`，控制回退背景色
- `status`: `'online' | 'offline' | 'busy' | 'none'` — 默认 `'none'`，右下角状态圆点（online=绿/offline=灰/busy=红）

子组件：Avatar, AvatarImage, AvatarFallback

## Progress

```vue
<Progress :model-value="60" :max="100" :show-label="true" />
<Progress indeterminate />
```

- `modelValue`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`
- `indeterminate`: `boolean` — 默认 `false`，不确定状态（CSS 动画循环滑动，忽略 modelValue）
- `showLabel`: `boolean` — 默认 `false`，显示百分比文字

## Pagination

```vue
<Pagination
  :current-page="1" :total-pages="10"
  :sibling-count="1" show-first-last
  @update:current-page="handlePageChange"
/>
```

- `currentPage`: `number` — 必填
- `totalPages`: `number` — 必填
- `siblingCount`: `number` — 默认 `1`
- `showFirstLast`: `boolean` — 默认 `true`
- `showPageNumbers`: `boolean` — 默认 `true`
- `variant`: `'default' | 'outline'`
- `size`: `'default' | 'sm' | 'lg'`
- Events: `update:currentPage(page: number)`, `jump()` — 点击省略号按钮时触发（省略号现为可点击 `<button>`，带 `aria-label`）

## Counter

数字动画，从一个值过渡到另一个。

```vue
<Counter :to="1000" :duration="2000" prefix="$" suffix="+" separator="," />
```

- `to`: `number` — 必填
- `from`: `number` — 默认 `0`
- `duration`: `number` — 默认 `2000`
- `decimals`: `number` — 默认 `0`
- `prefix`: `string`
- `suffix`: `string`
- `prefixComponent`: `Component` — 自定义前缀组件
- `suffixComponent`: `Component` — 自定义后缀组件
- `animatePrefix`: `boolean` — 默认 `true`（false 时显示文本前缀）
- `animateSuffix`: `boolean` — 默认 `true`（false 时显示文本后缀）
- `separator`: `string` — 默认 `','`
- `easing`: `'linear' | 'ease-out' | 'ease-in-out'` — 默认 `'ease-out'`
- `autoStart`: `boolean` — 默认 `true`
- `size`: `'sm' | 'md' | 'lg'`
- `variant`: `'default' | 'primary' | 'accent' | 'success' | 'danger'` — 默认 `'default'`，仅影响文字颜色

## DataTable

高级数据表格组件，支持排序、筛选、分页、行选择。内部通过 4 个独立 composables 管理状态，可直接复用。

```vue
<script setup lang="ts">
import { DataTable } from 'brutx-ui-vue'
import type { DataTableColumn } from 'brutx-ui-vue'

interface User {
    id: number
    name: string
    email: string
}

const columns: DataTableColumn<User>[] = [
    { id: 'name', header: '姓名', accessorKey: 'name', sortable: true },
    { id: 'email', header: '邮箱', accessorKey: 'email' },
]

const data: User[] = [
    { id: 1, name: '张三', email: 'zhang@example.com' },
]
</script>

<template>
    <DataTable
        :data="data"
        :columns="columns"
        row-key="id"
        :paginated="true"
        :page-size="10"
        sortable
        filterable
        selectable
    />
</template>
```

- `data`: `T[]` — 数据数组（必填）
- `columns`: `DataTableColumn<T>[]` — 列配置（必填）
- `rowKey`: `keyof T | ((row: T) => string | number)` — 行唯一标识（必填）
- `sortable`: `boolean` — 默认 `false`
- `filterable`: `boolean` — 默认 `false`
- `selectable`: `boolean` — 默认 `false`
- `paginated`: `boolean` — 默认 `false`
- `pageSize`: `number` — 默认 `10`
- `pageSizeOptions`: `number[]` — 默认 `[10, 20, 50, 100]`
- `loading`: `boolean` — 默认 `false`
- `emptyMessage`: `string` — 空数据提示
- `size`: `'sm' | 'default' | 'lg'` — 字体与单元格 padding，默认 `'default'`
- `dense`: `boolean` — 进一步压缩行高（与 `size` 正交），默认 `false`
- `striped`: `boolean` — 奇偶行交替背景，默认 `true`
- `stickyHeader`: `boolean` — 表头吸顶，默认 `false`
- `virtualScroll`: `DataTableVirtualScroll` — 虚拟滚动配置

### Slots

| Slot | 作用域 | 用途 |
| --- | --- | --- |
| `toolbar` | — | 工具栏区域，位于筛选框右侧 |
| `cell-{columnId}` | `{ row: T; value: unknown }` | 自定义特定列的单元格渲染 |
| `empty` | — | 数据为空时的自定义空状态 |
| `loading` | — | 自定义加载态内容，仅在 `loading` 为 `true` 时渲染 |

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `sort` | `[column: string, direction: 'asc' \| 'desc' \| null]` | 排序变化时触发 |
| `filter` | `[filters: DataTableFilterState]` | 筛选状态变化时触发 |
| `select` | `[rows: T[]]` | 行选择变化时触发 |
| `pageChange` | `[page: number]` | 页码变化时触发 |
| `pageSizeChange` | `[size: number]` | 每页条数变化时触发 |
| `export` | `[format: 'csv' \| 'json']` | 导出时触发 |

### Composables

DataTable 内部由 4 个独立 composables 驱动，均已从 `brutx-ui-vue` 导出，可在自定义表格中单独复用：

- `useDataTableSort` — 三态排序（asc → desc → null）
- `useDataTableFilter` — 全局 + 列级过滤
- `useDataTableSelection` — 行选择与全选（跨页保留）
- `useDataTablePagination` — 分页状态与导航

数据流为单向管道：`filter → sort → pagination → selection`，`useDataTableSelection` 接收 `displayData`（分页后数据）作为参数以避免环依赖。

### 暴露方法

通过 `ref` 可访问以下命名空间方法（以源码 `defineExpose` 实际内容为准）：

| 命名空间 | 方法/属性 | 说明 |
|----------|----------|------|
| `sort` | `toggleSort(columnId)` | 切换列排序 |
| `sort` | `sortState` | 当前排序状态 |
| `filter` | `filterState` | 当前筛选状态 |
| `filter` | `setGlobalFilter(value)` | 设置全局筛选 |
| `selection` | `toggleRow(row)` | 切换行选择 |
| `selection` | `toggleAllRows()` | 切换全选 |
| `selection` | `clearSelection()` | 清空选择 |
| `selection` | `getSelectedRows()` | 获取选中行数组 |
| `selection` | `selectedRows` | 选中行集合 |
| `selection` | `isAllSelected` | 是否全选 |
| `pagination` | `goToPage(index)` | 跳转页码 |
| `pagination` | `nextPage()` | 下一页 |
| `pagination` | `previousPage()` | 上一页 |
| `pagination` | `setPageSize(size)` | 设置每页条数 |
| `pagination` | `pageIndex` | 当前页索引 |
| `pagination` | `pageCount` | 总页数 |

### 工具函数

`getCellValue` 已提取为共享工具函数，位于 `@/lib/data-table-utils`，可在自定义 composable 中复用。

## VirtualScroll

虚拟滚动组件，基于 @tanstack/vue-virtual 实现，适用于大数据列表的高性能滚动。

```vue
<script setup lang="ts">
import { VirtualScroll } from 'brutx-ui-vue'

const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `项目 ${i + 1}`,
}))
</script>

<template>
  <VirtualScroll
    :items="items"
    :item-height="48"
    size="default"
    variant="striped"
    @scroll-end="loadMore"
  >
    <template #default="{ item, index }">
      <div class="p-4 border-b-2 border-brutal">
        {{ item.name }}
      </div>
    </template>
  </VirtualScroll>
</template>
```

- `items`: `VirtualScrollItem[]` — 数据数组（必填），每项必须有 `id` 字段
- `itemHeight`: `number` — 每项高度（像素），默认 `48`
- `size`: `'sm' | 'default' | 'lg' | 'xl' | 'full'` — 容器尺寸变体，默认 `'default'`
- `variant`: `'default' | 'striped' | 'bordered'` — 列表项样式变体，默认 `'default'`
- `overscan`: `number` — 可视区域外预渲染的项目数量，默认 `5`
- `scrollEndThreshold`: `number` — 滚动到底部检测阈值（像素），默认 `50`
- Events: `scroll(scrollTop: number)`, `scroll-end`
- 插槽: `default`（列表项）、`empty`（空状态）、`loading`（加载更多）
- 暴露方法: `scrollToIndex(index: number)` — 通过 ref 调用，滚动到指定索引

```typescript
interface VirtualScrollItem {
  id: string | number
  [key: string]: unknown
}
```

> 注意：组件会自动支持 prefers-reduced-motion，当用户启用减少动画时会禁用动画效果。

## Kbd

键盘按键展示。

```vue
<Kbd size="md">Ctrl</Kbd> + <Kbd size="md">C</Kbd>
<Kbd variant="primary">⌘</Kbd>
```

- `size`: `'sm' | 'md' | 'lg'` — 默认 `'md'`
- `variant`: `'default' | 'primary' | 'secondary' | 'accent'` — 默认 `'default'`

## CodeBlock

```vue
<CodeBlock code="const x = 1" language="typescript" filename="example.ts" :show-line-numbers="true" :max-lines="10" />
```

- `code`: `string` — 必填
- `language`: `string` — 默认 `'plaintext'`
- `filename`: `string`
- `showLineNumbers`: `boolean` — 默认 `false`
- `maxLines`: `number` — 默认 `undefined`（不限制）。超过时裁剪并显示展开/收起按钮

## Marquee

```vue
<Marquee direction="left" :speed="20" :pause-on-hover="true" :fade="true" variant="primary" size="lg">
  <span>滚动内容...</span>
</Marquee>
```

- `direction`: `'left' | 'right'` — 默认 `'left'`
- `speed`: `number` — 默认 `20`
- `pauseOnHover`: `boolean` — 默认 `false`
- `fade`: `boolean` — 默认 `false`
- `variant`: `'default' | 'primary' | 'accent' | 'muted'` — 默认 `'accent'`，控制背景色和边框色
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`，控制文字大小和 padding
- 尊重 `prefers-reduced-motion`：启用时移除动画类（`[animation:none]`）并跳过镜像副本渲染，静态展示内容

## BeforeAfter

前后对比图。

```vue
<BeforeAfter before="/before.jpg" after="/after.jpg" before-alt="修改前" after-alt="修改后" orientation="horizontal" />
```

- `before`: `string` — 必填
- `after`: `string` — 必填
- `beforeAlt`: `string`
- `afterAlt`: `string`
- `defaultValue`: `number` — 默认 `50`
- `disabled`: `boolean`
- `orientation`: `'horizontal' | 'vertical'` — 默认 `'horizontal'`，vertical 时从下到上裁剪、滑块水平方向、handle 图标旋转 90°
- 尊重 `prefers-reduced-motion`：启用时移除滑块 transition（`transition-[left,top,clip-path]` 不附加），拖拽即时响应

## ChatBubble

```vue
<ChatBubble :message="{ id: '1', content: '你好！', variant: 'sent', name: '我', timestamp: '10:30', status: 'read' }" color="primary" size="lg" />
```

- `message`: `ChatMessage` — `{ id: string; content: string; variant?: 'sent'|'received'|'system'; avatar?: string; name?: string; timestamp?: string | Date; status?: 'sending'|'sent'|'delivered'|'read'|'failed' }`
- `showAvatar`: `boolean` — 默认 `true`
- `showStatus`: `boolean` — 默认 `true`
- `showTimestamp`: `boolean` — 默认 `true`
- `dateFormat`: `(date: Date) => string` — 自定义日期格式化
- `color`: `'default' | 'primary' | 'accent'` — 默认 `'default'`，仅影响 `variant="sent"` 的气泡颜色
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`，控制文字大小、padding，联动头像尺寸

## ChatContainer

聊天消息容器，支持时间分组。

```vue
<ChatContainer :messages="messages" group-by-time show-status />
```

- `messages`: `ChatMessage[]` — 消息数组（必填）
- `groupByTime`: `boolean` — 默认 `false`
- `showAvatar`: `boolean` — 默认 `true`
- `showStatus`: `boolean` — 默认 `true`
- `showTimestamp`: `boolean` — 默认 `true`

## Skeleton

```vue
<Skeleton class="h-4 w-[250px]" size="default" shape="rect" width="100%" />
<SkeletonText :lines="3" />
<SkeletonCard />
<SkeletonAvatar />
<SkeletonTable :rows="5" :cols="4" />
```

- `size`: `'sm' | 'default' | 'lg' | 'xl'` — 默认 `'default'`，控制高度（circle 时宽=高）
- `shape`: `'rect' | 'circle'` — 默认 `'rect'`，circle 时 rounded-full 且宽=高
- `width`: `string` — 自定义宽度（如 `'100%'`、`'200px'`），circle 时同步设高

子组件：Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable

## Spinner

```vue
<Spinner />
<Spinner size="sm" />
<BlockSpinner />
<DotsSpinner />
<BarsSpinner />
```

- `size`: `'sm' | 'default' | 'lg'`

子组件：Spinner, BlockSpinner, DotsSpinner, BarsSpinner
