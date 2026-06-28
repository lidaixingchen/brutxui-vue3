---
title: Progress 进度条
description: 进度条组件，支持动画过渡和自定义指示器色块，粗边缘设计。
---

# Progress 进度条

基于 reka-ui 的 Progress 原语构建的新粗野主义风格进度条。

## 预览

<ComponentPreview>
  <ProgressDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="progress" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(45)
</script>

<template>
    <Progress v-model="progress" />
</template>
```

## 带最大值

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(75)
</script>

<template>
    <Progress v-model="progress" :max="100" />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number` | `0` |
| `max` | `number` | `100` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` |
| `class` | `string` | — |

## 样式

- 轨道使用 `border-3 border-brutal` 搭配 `shadow-brutal-sm`，`rounded-brutal`
- 指示器根据 variant 使用不同颜色（default: `bg-brutal-primary`）搭配平滑的 transform 过渡
- 填充通过 `translateX` 实现平滑动画
