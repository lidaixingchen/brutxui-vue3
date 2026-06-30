---
title: InfiniteScroll 无限滚动
description: 滚动到底部自动加载更多数据。
---

# InfiniteScroll 无限滚动

滚动到底部自动加载更多数据。使用 `IntersectionObserver` 实现高效的滚动检测。

## 安装

<InstallationTabs componentName="infinite-scroll" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll } from 'brutx-ui-vue'

const items = ref(Array.from({ length: 20 }, (_, i) => `项目 ${i + 1}`))
const loading = ref(false)

async function loadMore() {
    loading.value = true
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newItems = Array.from(
        { length: 10 },
        (_, i) => `项目 ${items.value.length + i + 1}`
    )
    items.value.push(...newItems)
    loading.value = false
}
</script>

<template>
    <InfiniteScroll @load="loadMore">
        <div v-for="item in items" :key="item" class="p-4 border-b">
            {{ item }}
        </div>
    </InfiniteScroll>
</template>
```

### 自定义加载状态

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll, Spinner } from 'brutx-ui-vue'

const items = ref([])

async function loadMore() {
    // 加载数据
}
</script>

<template>
    <InfiniteScroll @load="loadMore">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>

        <template #loading>
            <div class="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span class="ml-2">加载中...</span>
            </div>
        </template>
    </InfiniteScroll>
</template>
```

### 禁用状态

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll } from 'brutx-ui-vue'

const items = ref([])
const hasMore = ref(true)

async function loadMore() {
    if (!hasMore.value) return
    // 加载数据...
    // 如果没有更多数据：
    // hasMore.value = false
}
</script>

<template>
    <InfiniteScroll :disabled="!hasMore" @load="loadMore">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>
    </InfiniteScroll>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `distance` | `number` | `100` | 触发距离阈值（像素） |
| `delay` | `number` | `200` | 防抖延迟（毫秒） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `immediate` | `boolean` | `true` | 挂载时是否立即检查 |
| `class` | `string` | — | 自定义 CSS 类 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `load` | — | 需要加载更多数据时触发 |

## 插槽

| 插槽 | 说明 |
| --- | --- |
| `default` | 内容列表 |
| `loading` | 自定义加载指示器 |

## 暴露的方法

| 方法 | 说明 |
| --- | --- |
| `resetLoading()` | 重置加载状态（数据加载完成后调用） |

## 组合式函数

更灵活的用法，使用 `useInfiniteScroll` 组合式函数：

```vue
<script setup>
import { ref } from 'vue'
import { useInfiniteScroll } from 'brutx-ui-vue'

const containerRef = ref(null)
const items = ref([])

const { isLoading, resetLoading } = useInfiniteScroll(containerRef, {
    distance: 100,
    delay: 200,
    onLoad: async () => {
        // 加载数据
        const newItems = await fetchItems()
        items.value.push(...newItems)
        resetLoading()
    },
})
</script>

<template>
    <div ref="containerRef">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>
    </div>
</template>
```

### useInfiniteScroll 选项

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `distance` | `number` | `100` | 触发距离阈值（像素） |
| `delay` | `number` | `200` | 防抖延迟（毫秒） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `immediate` | `boolean` | `true` | 挂载时是否立即检查 |
| `onLoad` | `() => void` | —（必填） | 加载回调 |

### useInfiniteScroll 返回值

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `isLoading` | `Ref<boolean>` | 是否正在加载 |
| `resetLoading` | `() => void` | 重置加载状态 |

## 可访问性

- **屏幕阅读器**：加载状态会被播报
- **减少动效**：加载动画尊重 `prefers-reduced-motion` 设置
