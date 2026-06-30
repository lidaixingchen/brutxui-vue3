---
title: Spinner 加载指示器
description: 加载指示器组件，提供旋转点、旋转线等多种经典粗野主义加载动画。
---

# Spinner 加载指示器

新粗野主义风格加载旋转器，提供 4 种视觉变体：标准、方块、圆点和条形。

## 预览

<ComponentPreview>
  <SpinnerDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="spinner" />

## 用法

### Spinner（标准）

```vue
<script setup>
import { Spinner } from 'brutx-ui-vue'
</script>

<template>
    <Spinner size="default" variant="default" />
</template>
```

### BlockSpinner

```vue
<script setup>
import { BlockSpinner } from 'brutx-ui-vue'
</script>

<template>
    <BlockSpinner size="default" />
</template>
```

### DotsSpinner

```vue
<script setup>
import { DotsSpinner } from 'brutx-ui-vue'
</script>

<template>
    <DotsSpinner size="default" />
</template>
```

### BarsSpinner

```vue
<script setup>
import { BarsSpinner } from 'brutx-ui-vue'
</script>

<template>
    <BarsSpinner size="default" />
</template>
```

## 变体

### Spinner 变体

| 变体 | 说明 |
|------|------|
| `default` | 顶部和右侧边框透明，旋转 |
| `primary` | 主色边框，旋转 |
| `secondary` | 辅助色边框，旋转 |
| `accent` | 顶部和右侧强调色边框，旋转 |

### 颜色方案

BlockSpinner、BarsSpinner 和 DotsSpinner 支持以下颜色方案：

| 颜色 | 说明 |
|------|------|
| `default` | 默认前景色 |
| `primary` | 主色 |
| `secondary` | 辅助色 |
| `accent` | 强调色 |
| `mixed` | 循环使用 primary、secondary、accent、info 多种颜色（仅 BlockSpinner 和 BarsSpinner） |

## 尺寸

所有旋转器类型支持以下尺寸：

| 尺寸 | Spinner | Block | Bars | Dots |
|------|---------|-------|------|------|
| `sm` | `h-5 w-5` | `h-5 w-5` | `h-4` | `gap-1` |
| `default` | `h-8 w-8` | `h-8 w-8` | `h-6` | `gap-2` |
| `lg` | `h-12 w-12` | `h-12 w-12` | `h-8` | `gap-3` |
| `xl` | `h-16 w-16` | `h-16 w-16` | `h-12` | `gap-4` |

## 动画

各组件使用不同的动画效果：

| 组件 | 动画类型 | 说明 |
|------|----------|------|
| Spinner | `animate-spin` | 旋转动画 |
| BlockSpinner | `animate-pulse` | 脉冲动画，4个方块依次延迟 |
| BarsSpinner | `animate-pulse` | 脉冲动画，5个条形依次延迟 |
| DotsSpinner | `animate-bounce` | 弹跳动画，3个圆点依次延迟 |

## Props

### Spinner

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体 |
| `label` | `string` | `t('spinner.loading')` | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

### BlockSpinner / BarsSpinner

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'mixed'` | `'default'` | 颜色方案，`mixed` 会循环使用多种颜色 |
| `label` | `string` | `t('spinner.loading')` | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

### DotsSpinner

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色方案 |
| `label` | `string` | `t('spinner.loading')` | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

## 可访问性

- **ARIA 属性**：所有 Spinner 组件均自动添加 `role="status"` 属性
- **屏幕阅读器**：通过 `aria-label` 提供屏幕阅读器标签，使用 `sr-only` 类隐藏视觉文本
- **自定义标签**：默认标签文本为本地化的 "Loading..."，可通过 `label` 属性自定义
