# 数据展示组件

## Table

基础表格，基于原生 HTML 表格元素构建。

```vue
<Table ariaLabel="近期发票列表">
  <TableCaption>发票列表</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>列 1</TableHead>
      <TableHead>列 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>数据 1</TableCell>
      <TableCell>数据 2</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan="2">合计</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

子组件：Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption

### Table Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ariaLabel` | `string` | — | 表格的可访问名称 |
| `class` | `string` | — | 自定义样式类 |

### TableHeader / TableHead Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | 表头颜色变体 |
| `class` | `string` | — | 自定义样式类 |

### TableFooter Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 表尾颜色变体 |
| `class` | `string` | — | 自定义样式类 |

## DataTable

高级数据表格，支持排序、筛选、分页、行选择、虚拟滚动。

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

### DataTable Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `T[]` | —（必填） | 表格数据源 |
| `columns` | `DataTableColumn<T>[]` | —（必填） | 列定义配置 |
| `rowKey` | `keyof T \| ((row: T) => string \| number)` | —（必填） | 行唯一标识 |
| `sortable` | `boolean` | `false` | 是否启用排序 |
| `filterable` | `boolean` | `false` | 是否启用筛选 |
| `selectable` | `boolean` | `false` | 是否启用行选择 |
| `paginated` | `boolean` | `false` | 是否启用分页 |
| `pageSize` | `number` | `10` | 每页显示条数 |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | 每页条数选项 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `emptyMessage` | `string` | 国际化默认值 | 数据为空时的提示信息 |
| `virtualScroll` | `DataTableVirtualScroll` | — | 虚拟滚动配置 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 表格尺寸 |
| `dense` | `boolean` | `false` | 是否启用紧凑密度 |
| `striped` | `boolean` | `true` | 是否显示条纹 |
| `stickyHeader` | `boolean` | `false` | 是否启用粘性表头 |
| `class` | `string` | — | 自定义样式类 |

### DataTableColumn 类型

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 列唯一标识，必填 |
| `header` | `string \| ((ctx) => string)` | 列标题，必填 |
| `accessorKey` | `keyof T & string` | 通过 key 访问行数据字段 |
| `accessorFn` | `(row: T) => unknown` | 通过函数访问行数据值 |
| `cell` | `(props: { row: T; value: unknown }) => VNode \| string` | 自定义单元格渲染 |
| `sortable` | `boolean` | 是否可排序，默认 `true` |
| `hidden` | `boolean` | 是否隐藏 |
| `width` | `number \| 'auto'` | 列宽度 |
| `align` | `'left' \| 'center' \| 'right'` | 对齐方式 |

### DataTable 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `sort` | `[column: string, direction: 'asc' \| 'desc' \| null]` | 排序变化时触发 |
| `filter` | `[filters: DataTableFilterState]` | 筛选条件变化时触发 |
| `select` | `[rows: T[]]` | 选中行变化时触发 |
| `page-change` | `[page: number]` | 页码变化时触发 |
| `page-size-change` | `[size: number]` | 每页条数变化时触发 |
| `export` | `[format: 'csv' \| 'json', selectedRows?: T[]]` | 导出操作触发 |

### DataTable 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `toolbar` | — | 工具栏区域，位于筛选框右侧 |
| `cell-{columnId}` | `{ row: T; value: unknown }` | 自定义特定列的单元格渲染 |
| `empty` | — | 数据为空时的自定义空状态 |
| `loading` | — | 自定义加载态内容 |

### DataTable 暴露的 API

通过 `ref` 访问，包含 `sort`、`filter`、`selection`、`pagination` 四组命名空间方法。

## Badge

```vue
<Badge variant="success">已完成</Badge>
<Badge variant="primary" dot>在线</Badge>
<Badge variant="danger" pulse>新消息</Badge>
<Badge variant="primary" closable @close="handleClose">可关闭</Badge>
```

### Badge Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `dot` | `boolean` | `false` | 是否显示圆点指示器 |
| `pulse` | `boolean` | `false` | 是否启用脉冲动画（隐含 `dot`） |
| `closable` | `boolean` | `false` | 是否显示关闭按钮 |
| `class` | `string` | — | 自定义样式类 |

### Badge 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `close` | — | 点击关闭按钮时触发 |

### Badge 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 徽标文本内容 |
| `icon` | 徽标前的图标内容 |

## Avatar

```vue
<Avatar size="lg" shape="rounded" variant="primary" status="online">
  <AvatarImage src="https://..." alt="用户头像" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

子组件：Avatar, AvatarImage, AvatarFallback

### Avatar Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `shape` | `'square' \| 'rounded'` | `'square'` | 形状 |
| `status` | `'online' \| 'offline' \| 'busy' \| 'none'` | `'none'` | 右下角状态圆点 |
| `class` | `string` | — | 自定义样式类 |

### AvatarImage Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | — | 图片地址 |
| `alt` | `string` | — | 替代文本 |
| `class` | `string` | — | 自定义样式类 |

## Progress

```vue
<Progress :model-value="60" :max="100" show-label />
<Progress indeterminate />
<Progress :model-value="60" variant="success" size="lg" />
```

### Progress Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | `0` | 当前进度值 |
| `max` | `number` | `100` | 最大值 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 进度条高度预设 |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | 指示器颜色变体 |
| `indeterminate` | `boolean` | `false` | 是否为不确定状态 |
| `showLabel` | `boolean` | `false` | 是否显示百分比标签 |
| `class` | `string` | — | 自定义样式类 |

## Pagination

```vue
<Pagination
  v-model="currentPage"
  :total-pages="10"
  :sibling-count="1"
  show-first-last
  variant="default"
  size="default"
/>
```

### Pagination Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | —（必填） | 当前页码 |
| `totalPages` | `number` | —（必填） | 总页数 |
| `siblingCount` | `number` | `1` | 当前页码两侧显示的兄弟页数 |
| `showFirstLast` | `boolean` | `true` | 是否显示首页/末页按钮 |
| `showPageNumbers` | `boolean` | `true` | 是否显示页码按钮 |
| `variant` | `'default' \| 'rounded' \| 'minimal'` | `'default'` | 组件变体样式 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 组件尺寸 |
| `class` | `string` | — | 自定义样式类 |

### Pagination 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `page: number` | 页码变化时触发 |
| `jump` | — | 点击省略号按钮时触发 |

## Counter

数字滚动动画组件。

```vue
<Counter :to="1000" :duration="2000" prefix="$" suffix="+" separator="," />
<Counter :to="99.9" :decimals="1" suffix="%" />
<Counter ref="counterRef" :to="500" :auto-start="false" />
```

### Counter Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `to` | `number` | —（必填） | 目标数值 |
| `from` | `number` | `0` | 起始数值 |
| `duration` | `number` | `2000` | 动画时长（毫秒） |
| `decimals` | `number` | `0` | 小数位数 |
| `prefix` | `string` | `''` | 数字前缀 |
| `suffix` | `string` | `''` | 数字后缀 |
| `prefixComponent` | `Component` | — | 自定义前缀组件 |
| `suffixComponent` | `Component` | — | 自定义后缀组件 |
| `animatePrefix` | `boolean` | `true` | 是否显示自定义前缀组件 |
| `animateSuffix` | `boolean` | `true` | 是否显示自定义后缀组件 |
| `separator` | `string` | `','` | 千位分隔符 |
| `easing` | `'linear' \| 'ease-out' \| 'ease-in-out'` | `'ease-out'` | 缓动函数 |
| `autoStart` | `boolean` | `true` | 是否挂载后自动播放 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 字号预设 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | 文字颜色变体 |
| `class` | `string` | — | 自定义样式类 |

### Counter 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `complete` | — | 动画播放完毕时触发 |

### Counter 暴露的 API

| 方法 | 说明 |
|------|------|
| `play()` | 从 `from` 重新开始播放动画 |
| `stop()` | 立即停止动画 |

## Kbd

键盘按键展示。

```vue
<Kbd size="md">Ctrl</Kbd> + <Kbd size="md">C</Kbd>
<Kbd variant="primary">⌘</Kbd>
```

### Kbd Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 按键颜色变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按键尺寸 |
| `class` | `string` | — | 自定义样式类 |

## CodeBlock

代码块，集成 Prism 语法高亮。

```vue
<CodeBlock
  code="const x = 1"
  language="typescript"
  filename="example.ts"
  show-line-numbers
  :max-lines="10"
/>
```

### CodeBlock Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `code` | `string` | —（必填） | 原始代码文本 |
| `language` | `string` | `'plaintext'` | 代码语言 |
| `filename` | `string` | `""` | 文件名 |
| `showLineNumbers` | `boolean` | `false` | 是否显示行号 |
| `maxLines` | `number` | `undefined` | 最大可见行数，超出时裁剪并显示展开/收起按钮 |
| `class` | `string` | `""` | 自定义样式类 |

## Marquee

跑马灯，无限水平循环滚动。

```vue
<Marquee direction="left" :speed="20" pause-on-hover fade variant="primary" size="lg">
  <span>滚动内容...</span>
</Marquee>
```

### Marquee Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `'left' \| 'right'` | `'left'` | 滚动方向 |
| `speed` | `number` | `20` | 单次循环秒数（越小越快） |
| `pauseOnHover` | `boolean` | `false` | 鼠标悬停时暂停 |
| `fade` | `boolean` | `false` | 边缘淡入淡出效果 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | 背景与文字颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 文字大小与内边距 |
| `class` | `string` | `""` | 自定义样式类 |

## BeforeAfter

前后对比图滑块。

```vue
<BeforeAfter
  v-model="position"
  before="/before.jpg"
  after="/after.jpg"
  before-alt="修改前"
  after-alt="修改后"
  orientation="horizontal"
/>
```

### BeforeAfter Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `before` | `string` | —（必填） | 原始图片 URL |
| `after` | `string` | —（必填） | 对比图片 URL |
| `beforeAlt` | `string` | 国际化默认值 | 原始图片 alt 属性 |
| `afterAlt` | `string` | 国际化默认值 | 对比图片 alt 属性 |
| `modelValue` | `number` | — | 分割线位置（v-model，0-100） |
| `defaultValue` | `number` | `50` | 初始分割线位置 |
| `disabled` | `boolean` | `false` | 是否禁用拖拽 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 分割线方向 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 拖拽手柄图标尺寸 |
| `class` | `string` | `""` | 自定义样式类 |

### BeforeAfter 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 分割线位置变化时触发 |

## ChatBubble

聊天气泡。

```vue
<ChatBubble
  :message="{ id: '1', content: '你好！', variant: 'sent', name: '我', timestamp: '10:30', status: 'read' }"
  color="primary"
  size="lg"
/>
```

### ChatMessage 类型

```typescript
interface ChatMessage {
  id: string
  content: string
  variant?: 'sent' | 'received' | 'system'
  avatar?: string
  name?: string
  timestamp?: string | Date
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}
```

### ChatBubble Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `ChatMessage` | —（必填） | 消息数据对象 |
| `color` | `'default' \| 'primary' \| 'accent'` | `'default'` | sent 气泡的背景配色 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 气泡内边距/文字大小 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态图标 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数 |
| `class` | `string` | — | 自定义样式类 |

### ChatContainer Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `messages` | `ChatMessage[]` | —（必填） | 消息数组 |
| `groupByTime` | `boolean` | `false` | 是否按时间分组 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数 |
| `class` | `string` | — | 自定义样式类 |

## Skeleton

骨架屏占位组件。

```vue
<Skeleton class="h-4 w-[250px]" size="default" shape="rect" width="100%" />
<SkeletonText :lines="3" />
<SkeletonCard />
<SkeletonAvatar />
<SkeletonTable :rows="5" :cols="4" />
```

子组件：Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable

### Skeleton Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 控制高度 |
| `shape` | `'rect' \| 'circle'` | `'rect'` | 形状 |
| `width` | `string` | — | 自定义宽度 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonText Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `lines` | `number` | `3` | 文本行数 |
| `lastLineWidth` | `string` | `'60%'` | 最后一行宽度 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonTable Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `rows` | `number` | `5` | 数据行数 |
| `columns` | `number` | `4` | 列数 |
| `class` | `string` | — | 自定义样式类 |

## Spinner

加载指示器，提供 4 种视觉变体。

```vue
<Spinner size="default" variant="default" />
<BlockSpinner size="default" color="mixed" />
<DotsSpinner size="default" />
<BarsSpinner size="default" />
```

子组件：Spinner, BlockSpinner, DotsSpinner, BarsSpinner

### Spinner Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `label` | `string` | 国际化默认值 | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

### BlockSpinner / BarsSpinner Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'mixed'` | `'default'` | 颜色方案 |
| `label` | `string` | 国际化默认值 | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

### DotsSpinner Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色方案 |
| `label` | `string` | 国际化默认值 | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

## VirtualScroll

虚拟滚动组件，基于 @tanstack/vue-virtual 实现。

```vue
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
```

### VirtualScrollItem 类型

```typescript
interface VirtualScrollItem {
  id: string | number
  [key: string]: unknown
}
```

### VirtualScroll Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `VirtualScrollItem[]` | —（必填） | 数据数组 |
| `itemHeight` | `number` | `48` | 每项高度（像素） |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | 容器尺寸变体 |
| `variant` | `'default' \| 'striped' \| 'bordered'` | `'default'` | 列表项样式变体 |
| `overscan` | `number` | `5` | 可视区域外预渲染数量 |
| `scrollEndThreshold` | `number` | `50` | 滚动到底部检测阈值（像素） |
| `class` | `string` | — | 自定义样式类 |

### VirtualScroll 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `scroll` | `scrollTop: number` | 滚动时触发 |
| `scroll-end` | — | 滚动到底部时触发 |

### VirtualScroll 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ item: VirtualScrollItem, index: number }` | 列表项渲染 |
| `empty` | — | 空状态展示 |
| `loading` | — | 加载更多展示 |

### VirtualScroll 暴露的 API

| 方法 | 参数 | 说明 |
|------|------|------|
| `scrollToIndex` | `index: number` | 滚动到指定索引位置 |

## DashboardStats

仪表盘统计卡片。

```vue
<DashboardStats
  title="概览"
  subtitle="本月关键指标"
  :stats="[
    {
      title: '收入',
      value: '$45,231',
      description: '本月总收入',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      accentColor: 'primary',
      progress: 75,
    }
  ]"
/>
```

### StatItem 类型

```typescript
interface StatItem {
  title: string
  value: string
  description: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: Component
  accentColor?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
  progress?: number
}
```

### DashboardStats Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `stats` | `StatItem[]` | `[]` | 统计项数据数组 |
| `title` | `string` | 国际化默认值 | 标题文本 |
| `subtitle` | `string` | — | 副标题文本 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### DashboardStats 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `stat-click` | `number` | 点击统计卡片时触发，参数为卡片索引 |
