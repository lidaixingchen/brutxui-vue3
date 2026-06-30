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

### 带最大值

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

### 不确定状态

当无法确定具体进度时，设置 `indeterminate` 为 `true`，进度条会忽略 `modelValue`，指示器以 CSS 动画在轨道内循环滑动。

```vue
<script setup>
import { Progress } from 'brutx-ui-vue'
</script>

<template>
    <Progress indeterminate />
</template>
```

### 显示百分比标签

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

## 变体

`variant` 控制进度指示器的填充颜色。

| 变体 | 说明 |
| --- | --- |
| `default` | Primary 颜色（`bg-brutal-primary`） |
| `secondary` | Secondary 颜色（`bg-brutal-secondary`） |
| `accent` | Accent 颜色（`bg-brutal-accent`） |
| `success` | Success 颜色（`bg-brutal-success`） |
| `danger` | Destructive 颜色（`bg-brutal-destructive`） |

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const value = ref(60)
</script>

<template>
    <div class="flex flex-col gap-4">
        <Progress v-model="value" variant="default" />
        <Progress v-model="value" variant="secondary" />
        <Progress v-model="value" variant="accent" />
        <Progress v-model="value" variant="success" />
        <Progress v-model="value" variant="danger" />
    </div>
</template>
```

## 尺寸

`size` 控制进度条的高度。

| 尺寸 | 说明 |
| --- | --- |
| `sm` | 小尺寸（`h-3`） |
| `default` | 默认尺寸（`h-6`） |
| `lg` | 大尺寸（`h-8`） |

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const value = ref(50)
</script>

<template>
    <div class="flex flex-col gap-4">
        <Progress v-model="value" size="sm" />
        <Progress v-model="value" size="default" />
        <Progress v-model="value" size="lg" />
    </div>
</template>
```

## Props

### Progress

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 当前进度值 |
| `max` | `number` | `100` | 最大值 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 进度条高度预设 |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | 指示器颜色变体 |
| `indeterminate` | `boolean` | `false` | 是否为不确定状态（指示器循环滑动，忽略 `modelValue`） |
| `showLabel` | `boolean` | `false` | 是否在进度条中央显示百分比标签（不确定状态下不显示） |
| `class` | `string` | — | 自定义样式类 |

## 可访问性

组件基于 reka-ui 的 `ProgressRoot` 原语，自动具备以下无障碍属性：

- `role="progressbar"`
- `aria-valuemin="0"`
- `aria-valuemax` 对应 `max` 值
- `aria-valuenow` 对应当前 `modelValue`（不确定状态下不设置）
