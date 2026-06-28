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

## 不确定状态

当无法确定具体进度时，设置 `indeterminate` 为 `true`，进度条会忽略 `modelValue`，指示器以 CSS 动画在轨道内循环滑动。

```vue
<script setup>
import { Progress } from 'brutx-ui-vue'
</script>

<template>
    <Progress indeterminate />
</template>
```

## 显示百分比标签

设置 `showLabel` 为 `true` 时，会在进度条中央显示当前百分比文字（基于 `modelValue` 与 `max` 计算，四舍五入取整）。不确定状态下不显示标签。

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(65)
</script>

<template>
    <Progress v-model="progress" show-label />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number` | `0` |
| `max` | `number` | `100` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` |
| `indeterminate` | `boolean` | `false` |
| `showLabel` | `boolean` | `false` |
| `class` | `string` | — |

## 样式

- 轨道使用 `border-3 border-brutal` 搭配 `shadow-brutal-sm`，`rounded-brutal`
- 指示器根据 variant 使用不同颜色（default: `bg-brutal-primary`）搭配平滑的 transform 过渡
- 填充通过 `translateX` 实现平滑动画
