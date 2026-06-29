---
title: Pagination 分页
description: 分页控制组件，带硬质翻页按钮，适配各种列表和数据表格场景。
---

# Pagination 分页

新粗野主义风格的分页组件，内置计算分页算法，支持兄弟页数和首页/末页导航。

## 预览

<ComponentPreview>
  <PaginationDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="pagination" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const totalPages = 10
</script>

<template>
    <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
    />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准按钮 |
| `rounded` | 按钮使用 `--brutal-radius` 圆角 |
| `minimal` | 按钮无边框和阴影 |

## 尺寸

| 尺寸 | 按钮高度 | 间距 |
|------|----------|------|
| `sm` | `h-8` | `gap-1` |
| `default` | `h-10` | `gap-2` |
| `lg` | `h-12` | `gap-3` |

## 带完整选项

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model:current-page="currentPage"
        :total-pages="50"
        :sibling-count="2"
        :show-first-last="true"
        :show-page-numbers="true"
        variant="default"
        size="default"
    />
</template>
```

## 不显示页码

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model:current-page="currentPage"
        :total-pages="10"
        :show-page-numbers="false"
    />
</template>
```

## 可点击省略号

当总页数较多时，分页范围会以省略号 `...` 表示被折叠的页码。省略号现为可点击的 `<button>` 元素（带 `aria-label`，无障碍友好），点击后会触发 `jump` 事件（无载荷），开发者可在此事件中实现自定义跳页交互，例如弹出输入框让用户直接输入目标页码。

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)

function handleJump() {
    const input = window.prompt('跳转到第几页？')
    if (input !== null) {
        const page = Number(input)
        if (Number.isFinite(page)) {
            currentPage.value = page
        }
    }
}
</script>

<template>
    <Pagination
        v-model:current-page="currentPage"
        :total-pages="50"
        :sibling-count="1"
        @jump="handleJump"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `currentPage` | `number` | —（必填） |
| `totalPages` | `number` | —（必填） |
| `siblingCount` | `number` | `1` |
| `showFirstLast` | `boolean` | `true` |
| `showPageNumbers` | `boolean` | `true` |
| `variant` | `'default' \| 'rounded' \| 'minimal'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `update:currentPage` | `number` | 页码变化时触发 |
| `jump` | — | 点击省略号 `...` 按钮时触发，用于自定义跳页交互 |
