---
title: Rate 评分
description: 评分组件，拥有醒目的粗描边、亮黄色填充和悬浮缩放的微小交互动作。
---

# Rate 评分

基于 Lucide Star 矢量星星构建的评分组件。选中的星星拥有高饱和的 HSL themed 金黄色填充、粗黑描边，并且在 hover 时具有弹性的微交互放大和位移反馈。

## 预览

<ComponentPreview>
  <RateDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="rate" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3)
</script>

<template>
    <Rate v-model="value" />
</template>
```

## 允许半星

使用 `allow-half` 属性可以支持半星评分。

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3.5)
</script>

<template>
    <Rate v-model="value" allow-half />
</template>
```

## 自定义星星数

通过 `max` 属性可以调整评分的上限（默认为 `5`）。

```vue
<template>
    <Rate v-model="value" :max="10" />
</template>
```

## 只读模式

添加 `readonly` 属性使组件处于只读状态，移除所有的悬浮动画和点击交互。

```vue
<template>
    <Rate v-model="value" readonly allow-half />
</template>
```

## 尺寸

评分组件支持 `sm`、`md`、`lg` 三种尺寸：

```vue
<template>
    <Rate v-model="value" size="sm" />
    <Rate v-model="value" size="md" />
    <Rate v-model="value" size="lg" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | `0` | 当前绑定的评分值，支持 `v-model` 双向绑定 |
| `max` | `number` | `5` | 最大分值（星星总数） |
| `allowHalf` | `boolean` | `false` | 是否允许半星选择 |
| `readonly` | `boolean` | `false` | 是否只读（禁用所有交互） |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸大小 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 评分值变化时触发，支持双向绑定 |
| `change` | `number` | 选择评分且值发生变化时触发 |
