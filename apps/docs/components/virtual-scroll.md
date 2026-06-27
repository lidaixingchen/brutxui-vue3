---
title: VirtualScroll 虚拟滚动
description: 基于 @tanstack/vue-virtual 的高性能虚拟滚动组件，适用于大数据列表。
---

# VirtualScroll 虚拟滚动

基于 `@tanstack/vue-virtual` 封装的虚拟滚动组件，适用于大数据列表的高性能滚动场景。只渲染可视区域内的元素，大幅提升长列表的渲染性能。

## 预览

<ComponentPreview>
  <VirtualScrollDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="virtual-scroll" />

## 用法

```vue
<script setup>
import { VirtualScroll } from 'brutx-ui-vue'

const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `项目 ${i + 1}`,
}))
</script>

<template>
    <VirtualScroll :items="items" :item-height="48">
        <template #default="{ item, index }">
            <div class="p-4 border-b-2 border-brutal">
                {{ item.name }}
            </div>
        </template>
    </VirtualScroll>
</template>
```

## 尺寸变体

| 尺寸 | 最大高度 |
|------|----------|
| `sm` | `max-h-64` (16rem) |
| `default` | `max-h-96` (24rem) |
| `lg` | `max-h-[32rem]` |
| `xl` | `max-h-[48rem]` |
| `full` | `max-h-full` |

## 列表项样式变体

| 变体 | 说明 |
|------|------|
| `default` | 默认样式 |
| `striped` | 斑马纹（偶数行背景色） |
| `bordered` | 带底部边框 |

## 无障碍

- 使用 `role="list"` 和 `role="listitem"` 语义化标记
- 支持 `aria-setsize` 和 `aria-posinset` 属性
- 支持 `aria-label` 国际化标签

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `VirtualScrollItem[]` | — | 数据数组（必填），每项必须有 `id` 字段 |
| `itemHeight` | `number` | `48` | 每项高度（像素） |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | 容器尺寸变体 |
| `variant` | `'default' \| 'striped' \| 'bordered'` | `'default'` | 列表项样式变体 |
| `overscan` | `number` | `5` | 可视区域外预渲染的项目数量 |
| `scrollEndThreshold` | `number` | `50` | 滚动到底部检测阈值（像素） |
| `class` | `string` | — | 外部类覆盖 |

## 类型定义

```typescript
interface VirtualScrollItem {
    id: string | number
    [key: string]: unknown
}
```

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `scroll` | `scrollTop: number` | 滚动时触发 |
| `scroll-end` | — | 滚动到底部时触发 |

## 插槽

| 插槽 | 参数 | 说明 |
|------|------|------|
| `default` | `{ item: VirtualScrollItem, index: number }` | 列表项渲染 |
| `empty` | — | 空状态展示 |
| `loading` | — | 加载更多展示 |

## 示例

### 斑马纹列表

```vue
<VirtualScroll
    :items="items"
    variant="striped"
    size="lg"
>
    <template #default="{ item }">
        <div class="p-4">{{ item.name }}</div>
    </template>
</VirtualScroll>
```

### 加载更多

```vue
<VirtualScroll
    :items="items"
    @scroll-end="loadMore"
>
    <template #default="{ item }">
        <div class="p-4">{{ item.name }}</div>
    </template>
    <template #loading>
        <div class="p-4 text-center">加载中...</div>
    </template>
</VirtualScroll>
```

### 空状态

```vue
<VirtualScroll :items="[]">
    <template #empty>
        <div class="p-8 text-center">
            <Icon name="empty" class="w-16 h-16 mx-auto mb-4" />
            <p>暂无数据</p>
        </div>
    </template>
</VirtualScroll>
```

### 带边框的列表

```vue
<VirtualScroll
    :items="items"
    variant="bordered"
    :item-height="64"
>
    <template #default="{ item }">
        <div class="flex items-center gap-4 p-4">
            <Avatar :src="item.avatar" />
            <div>
                <p class="font-bold">{{ item.name }}</p>
                <p class="text-sm text-muted">{{ item.email }}</p>
            </div>
        </div>
    </template>
</VirtualScroll>
```
