---
title: Radio Group 单选组
description: 单选按钮组组件，用于在互斥选项中进行单项选择。
---

# Radio Group 单选组

基于 reka-ui 的 RadioGroup 原语构建的新粗野主义风格单选组，用于单项选择。

## 预览

<ComponentPreview>
  <RadioGroupDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="radio-group" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem, Label } from 'brutx-ui-vue'

const selected = ref('comfortable')
</script>

<template>
    <RadioGroup v-model="selected">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="default" />
            <Label for="default">Default</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="comfortable" />
            <Label for="comfortable">Comfortable</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="compact" />
            <Label for="compact">Compact</Label>
        </div>
    </RadioGroup>
</template>
```

## 无障碍标签

通过 `ariaLabel` 为单选组提供可读名称，便于屏幕阅读器识别分组用途。当没有可见的分组标题（如 `Label` 或字段集标题）时尤为有用。

```vue
<script setup>
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem } from 'brutx-ui-vue'

const density = ref('comfortable')
</script>

<template>
    <RadioGroup v-model="density" aria-label="布局密度">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="default" />
            <span class="text-sm font-bold">默认</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="comfortable" />
            <span class="text-sm font-bold">舒适</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="compact" />
            <span class="text-sm font-bold">紧凑</span>
        </div>
    </RadioGroup>
</template>
```

## Props

### RadioGroup

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `name` | `string` | — |
| `disabled` | `boolean` | — |
| `orientation` | `'horizontal' \| 'vertical'` | — |
| `ariaLabel` | `string` | — |
| `class` | `string` | — |

### RadioGroupItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `disabled` | `boolean` | `false` |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `class` | `string` | — |

## 事件

### RadioGroup

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string` |

## 无障碍

- 方向键在单选项之间导航
- 空格键选中当前聚焦项
- 选中项使用 `aria-checked="true"`
