---
title: Skeleton 骨架屏
description: 骨架屏占位组件，支持圆形、文本行、卡片等多种布局预览。
---

# Skeleton 骨架屏

新粗野主义风格的骨架屏加载组件，提供子组件用于常见加载模式。

## 预览

<ComponentPreview>
  <SkeletonDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="skeleton" />

## 用法

### 基础骨架屏

```vue
<script setup>
import { Skeleton } from 'brutx-ui-vue'
</script>

<template>
    <Skeleton class="h-12 w-12" />
</template>
```

### 形状

| 形状 | 说明 |
|------|------|
| `rect` | 圆角矩形（`rounded-brutal`） |
| `circle` | 圆形（`rounded-full`），宽高相等 |

```vue
<template>
    <div class="flex items-center gap-4">
        <Skeleton shape="rect" size="lg" width="80px" />
        <Skeleton shape="circle" size="lg" />
    </div>
</template>
```

### 自定义宽度

`width` 接受任意 CSS 宽度字符串，包括百分比；当 `shape="circle"` 时同时设置高度。

```vue
<template>
    <div class="space-y-2 w-full">
        <Skeleton width="100%" />
        <Skeleton width="75%" />
        <Skeleton width="50%" />
    </div>
</template>
```

### SkeletonText

```vue
<script setup>
import { SkeletonText } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonText :lines="3" />
</template>
```

### SkeletonAvatar

```vue
<script setup>
import { SkeletonAvatar } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonAvatar size="default" />
</template>
```

### SkeletonCard

```vue
<script setup>
import { SkeletonCard } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonCard />
</template>
```

### SkeletonTable

```vue
<script setup>
import { SkeletonTable } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonTable :rows="5" :columns="4" />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 灰色背景 |
| `primary` | 主色，30% 不透明度 |
| `secondary` | 辅助色，30% 不透明度 |
| `accent` | 强调色，30% 不透明度 |

## 尺寸

| 尺寸 | 高度 |
|------|------|
| `sm` | `h-8` |
| `default` | `h-10` |
| `lg` | `h-14` |
| `xl` | `h-20` |

当 `shape="circle"` 时，宽度与高度保持一致（`w-8`/`w-10`/`w-14`/`w-20`）。

```vue
<template>
    <div class="space-y-2">
        <Skeleton size="sm" width="200px" />
        <Skeleton size="default" width="200px" />
        <Skeleton size="lg" width="200px" />
        <Skeleton size="xl" width="200px" />
    </div>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Skeleton` | 基础骨架块，内置 `role="status"` 和 `aria-busy="true"` 无障碍属性 |
| `SkeletonText` | 多行骨架文本，支持自定义行数和末行宽度 |
| `SkeletonAvatar` | 圆形头像占位符 |
| `SkeletonCard` | 完整卡片骨架，包含图片区、标题、文本和按钮占位 |
| `SkeletonTable` | 表格骨架，内置 `role="table"` 和 `aria-busy="true"` 无障碍属性 |

## Props

### Skeleton

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 控制高度（`circle` 时同步控制宽度） |
| `shape` | `'rect' \| 'circle'` | `'rect'` | 形状；`circle` 时 `rounded-full` 且宽高相等 |
| `width` | `string` | — | 自定义宽度，支持百分比如 `'100%'`；`circle` 时同时设置高度 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonText

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `lines` | `number` | `3` | 文本行数 |
| `lastLineWidth` | `string` | `'60%'` | 最后一行的宽度，支持任意 CSS 宽度值 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonAvatar

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 头像尺寸，宽高相等 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonCard

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `class` | `string` | — | 自定义样式类 |

### SkeletonTable

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `rows` | `number` | `5` | 数据行数 |
| `columns` | `number` | `4` | 列数 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 骨架块内部内容，可放置自定义加载指示器或其他元素 |

## 可访问性

- **ARIA 属性**：`Skeleton` 内置 `role="status"` 和 `aria-busy="true"`；`SkeletonTable` 内置 `role="table"` 和 `aria-busy="true"`
