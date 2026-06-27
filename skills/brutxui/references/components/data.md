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

子组件：Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption

## Badge

```vue
<Badge variant="success">已完成</Badge>
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="lg">Large</Badge>
```

- `variant`: `'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline'`
- `size`: `'sm' | 'default' | 'lg'` — 默认 `'default'`

## Avatar

```vue
<Avatar size="lg" shape="circle">
  <AvatarImage src="https://..." />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

- `size`: `'sm' | 'default' | 'lg' | 'xl'`
- `shape`: `'square' | 'circle'`

子组件：Avatar, AvatarImage, AvatarFallback

## Progress

```vue
<Progress :model-value="60" :max="100" />
```

- `modelValue`: `number` — 默认 `0`
- `max`: `number` — 默认 `100`

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

## DataTable

高级数据表格组件，支持排序、筛选、分页、行选择。

```vue
<script setup lang="ts">
import { DataTable } from 'brutx-ui-vue'

const columns = [
    { id: 'name', header: '姓名', accessorKey: 'name', sortable: true },
    { id: 'email', header: '邮箱', accessorKey: 'email' },
]

const data = [
    { id: 1, name: '张三', email: 'zhang@example.com' },
]
</script>

<template>
    <DataTable
        :data="data"
        :columns="columns"
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
```

- `size`: `'sm' | 'md' | 'lg'` — 默认 `'md'`

## CodeBlock

```vue
<CodeBlock code="const x = 1" language="typescript" filename="example.ts" :show-line-numbers="true" />
```

- `code`: `string` — 必填
- `language`: `string` — 默认 `'plaintext'`
- `filename`: `string`
- `showLineNumbers`: `boolean` — 默认 `false`

## Marquee

```vue
<Marquee direction="left" :speed="20" :pause-on-hover="true" :fade="true">
  <span>滚动内容...</span>
</Marquee>
```

- `direction`: `'left' | 'right'` — 默认 `'left'`
- `speed`: `number` — 默认 `20`
- `pauseOnHover`: `boolean` — 默认 `false`
- `fade`: `boolean` — 默认 `false`

## BeforeAfter

前后对比图。

```vue
<BeforeAfter before="/before.jpg" after="/after.jpg" before-alt="修改前" after-alt="修改后" />
```

- `before`: `string` — 必填
- `after`: `string` — 必填
- `beforeAlt`: `string`
- `afterAlt`: `string`
- `defaultValue`: `number` — 默认 `50`
- `disabled`: `boolean`

## ChatBubble

```vue
<ChatBubble :message="{ id: '1', content: '你好！', variant: 'sent', name: '我', timestamp: '10:30', status: 'read' }" />
```

- `message`: `ChatMessage` — `{ id: string; content: string; variant?: 'sent'|'received'|'system'; avatar?: string; name?: string; timestamp?: string | Date; status?: 'sending'|'sent'|'delivered'|'read'|'failed' }`
- `showAvatar`: `boolean` — 默认 `true`
- `showStatus`: `boolean` — 默认 `true`
- `showTimestamp`: `boolean` — 默认 `true`
- `dateFormat`: `(date: Date) => string` — 自定义日期格式化

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
<Skeleton class="h-4 w-[250px]" />
<SkeletonText :lines="3" />
<SkeletonCard />
<SkeletonAvatar />
<SkeletonTable :rows="5" :cols="4" />
```

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
