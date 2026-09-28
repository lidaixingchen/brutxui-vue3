---
title: Pagination 分页
description: 分页控制组件，带硬质翻页按钮，适配各种列表和数据表格场景。
---

# Pagination 分页

新粗野主义风格的分页组件，基于内置计算分页算法构建，支持响应式分页范围计算（自动处理省略号显示）、首页/末页快速导航、可配置兄弟页数（`siblingCount`）控制显示范围，提供多种变体和尺寸选择，完整的无障碍支持（`aria-label`、`aria-current`），以及可点击省略号自定义跳页交互。

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
        v-model="currentPage"
        :total-pages="totalPages"
    />
</template>
```

### 带完整选项

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="50"
        :sibling-count="2"
        :show-first-last="true"
        :show-page-numbers="true"
        variant="default"
        size="default"
    />
</template>
```

### 自定义布局与快速跳转 (Jumper)

你可以通过 `layout` 属性选择要显示的功能模块，包括：总条数（`total`）、每页大小选择（`sizes`）、上一页（`prev`）、页码（`pager`）、下一页（`next`）和快速跳转（`jumper`）。
区域按 total、sizes、prev、pager、next、jumper 的固定顺序渲染。在 jumper 快速跳转输入框中，输入目标页码并按回车键（Enter）即可跳转。

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const pageSize = ref(10)
</script>

<template>
    <Pagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total="100"
        layout="total, sizes, prev, pager, next, jumper"
    />
</template>
```

### 不显示页码

当设置 `showPageNumbers` 为 `false` 时，组件会显示当前页码与总页数的计数器（如 "3 / 10"），而不是页码按钮。

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="10"
        :show-page-numbers="false"
    />
</template>
```

### 可点击省略号

当总页数较多时，分页范围会以省略号 `...` 表示被折叠的页码。省略号为可点击的 `<button>` 元素（带 `aria-label="Jump pages"`，无障碍友好），点击后会触发 `jump` 事件（无参数），开发者可在此事件中实现自定义跳页交互，例如弹出输入框让用户直接输入目标页码。

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
        v-model="currentPage"
        :total-pages="50"
        :sibling-count="1"
        @jump="handleJump"
    />
</template>
```

## 变体

| 变体 | 说明 |
| --- | --- |
| `default` | 标准按钮样式 |
| `rounded` | 按钮使用 `--brutal-radius` 圆角 |
| `minimal` | 按钮无边框和阴影 |

## 尺寸

| 尺寸 | 按钮高度 | 间距 | 图标尺寸 |
| --- | --- | --- | --- |
| `sm` | `h-8` | `gap-1` | `h-3 w-3` |
| `default` | `h-10` | `gap-2` | `h-4 w-4` |
| `lg` | `h-12` | `gap-3` | `h-5 w-5` |

## API 参考

<span id="事件"></span>

<ComponentApi name="pagination" />

## 可访问性

- **ARIA 属性**：根元素使用 `<nav>` 标签，`role="navigation"` 和 `aria-label` 属性；页码按钮使用 `aria-label="Go to page X"` 格式；当前页码按钮使用 `aria-current="page"` 标识
- **焦点管理**：导航按钮使用语义化标签（首页、上一页、下一页、末页）；禁用状态使用 `disabled` 属性和相应样式
