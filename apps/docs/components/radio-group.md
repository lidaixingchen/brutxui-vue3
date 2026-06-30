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

### 可访问性标签

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

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 默认风格，选中时使用 Primary（珊瑚色）背景 |
| `secondary` | 选中时使用 Secondary 背景 |
| `accent` | 选中时使用 Accent 背景 |
| `success` | 选中时使用 Success 背景 |
| `danger` | 选中时使用 Danger 背景 |

```vue
<template>
    <RadioGroupItem value="option" variant="danger" />
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸（20 × 20） |
| `default` | 默认尺寸（24 × 24） |
| `lg` | 大尺寸（28 × 28） |

## 子组件

| 组件 | 说明 |
|------|------|
| `RadioGroup` | 根容器，管理选中状态和键盘导航 |
| `RadioGroupItem` | 单选项，每个选项对应一个可选值 |

## Props

### RadioGroup

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 绑定值，当前选中的值 |
| `name` | `string` | — | 表单字段名称 |
| `disabled` | `boolean` | — | 是否禁用整个单选组 |
| `orientation` | `'horizontal' \| 'vertical'` | — | 排列方向 |
| `ariaLabel` | `string` | — | 无障碍标签，为屏幕阅读器提供分组名称 |
| `class` | `string` | — | 自定义样式类 |

### RadioGroupItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 单选项的值 |
| `disabled` | `boolean` | `false` | 是否禁用该项 |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `class` | `string` | — | 自定义样式类 |

## 事件

### RadioGroup

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 选中值变化时触发 |

## 可访问性

- **键盘操作**：方向键在单选项之间导航，空格键选中当前聚焦项
- **ARIA 属性**：选中项使用 `aria-checked="true"`，支持通过 `ariaLabel` 为分组提供可读名称
- **焦点管理**：`Tab` 键聚焦到选中项或第一项，方向键在选项间循环移动焦点
